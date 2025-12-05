// route/adminRoute.js
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Admin, { PERMISSIONS, ADMIN_ROLES } from "../models/Admin.js";
import Donor from "../models/Donor.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import Category from "../models/Category.js";
import ActivityLog from "../models/ActivityLog.js";
import authMiddleware from "../middleware/auth.js";
import {
  onlySuperAdmin,
  hasPermission,
} from "../middleware/authorize.js";
import * as adminController from "../controllers/adminController.js";

dotenv.config();
const router = express.Router();

// In-memory OTP store (expires after 5 minutes)
const adminOtpStore = {};

// Cleanup expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const email in adminOtpStore) {
    if (adminOtpStore[email].expiresAt < now) delete adminOtpStore[email];
  }
}, 60 * 1000);

//
// 1️⃣ ADMIN REGISTRATION
//
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    // Prevent duplicate Donor or Admin registration
    const donorExists = await Donor.findOne({ email });
    if (donorExists) {
      return res.json({
        success: false,
        message: "This email is already registered as a Donor.",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.json({ success: false, message: "Email already registered as Admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "Admin",
    });

    await newAdmin.save();

    return res.json({ success: true, message: "Admin registration successful!" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

//
// 2️⃣ ADMIN LOGIN
//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Missing email or password." });

    // Prevent logging in if it's a Donor email
    const donorExists = await Donor.findOne({ email });
    if (donorExists)
      return res.status(401).json({ success: false, message: "This email is registered as a Donor. Use Donor login." });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Check if admin is active
    if (admin.isActive === false) {
      return res.status(403).json({ 
        success: false, 
        message: "This admin account has been deactivated. Contact a SuperAdmin." 
      });
    }

    // If admin registered using Google (no password)
    if (!admin.password) {
      return res.status(400).json({
        success: false,
        message: "This account was registered with Google. Please log in using Google.",
      });
    }

    // Compare plain password with hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // ✅ Generate JWT token for authentication
    const jwtToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Calculate access level
    const maxPermissions = 15; // Total number of permissions available
    const accessLevel = admin.role === "SuperAdmin" 
      ? 100 
      : Math.round(20 + (admin.permissions?.length || 0) / maxPermissions * 80);

    // ✅ Login successful - Return token and admin data
    return res.json({
      success: true,
      message: "Admin login successful!",
      token: jwtToken,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        accessLevel: accessLevel,
        avatar: admin.avatar || admin.profileImage || "",
        profileImage: admin.profileImage || admin.avatar || "",
        contactNumber: admin.contactNumber || "",
        address: admin.address || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

//
// 2️⃣B REFRESH ADMIN DATA — Get updated admin info
//
router.get("/refresh-admin", authMiddleware, async (req, res) => {
  try {
    const adminId = req.userId;
    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    // Calculate access level
    const maxPermissions = 15;
    const accessLevel = admin.role === "SuperAdmin" 
      ? 100 
      : Math.round(20 + (admin.permissions?.length || 0) / maxPermissions * 80);

    return res.json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        accessLevel: accessLevel,
        avatar: admin.avatar || admin.profileImage || "",
        profileImage: admin.profileImage || admin.avatar || "",
        contactNumber: admin.contactNumber || "",
        address: admin.address || "",
      },
    });
  } catch (error) {
    console.error("Refresh admin error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

//
// 3️⃣ ADMIN FORGOT PASSWORD — Send OTP
//
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required." });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(404).json({ success: false, message: "Admin email not found." });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    adminOtpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // expires in 5 mins

    // Setup Nodemailer using env variables
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Admin Password Reset Code",
      text: `Your password reset code is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Verification code sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Error sending OTP." });
  }
});

//
// 4️⃣ ADMIN VERIFY OTP
//
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ success: false, message: "Email and OTP are required." });

  const record = adminOtpStore[email];
  if (!record)
    return res.status(400).json({ success: false, message: "No OTP found for this email." });

  if (Date.now() > record.expiresAt) {
    delete adminOtpStore[email];
    return res.status(400).json({ success: false, message: "OTP expired. Please request again." });
  }

  if (record.otp.toString() !== otp.toString())
    return res.status(400).json({ success: false, message: "Invalid OTP." });

  // ✅ OTP verified, delete after success
  delete adminOtpStore[email];

  return res.json({ success: true, message: "OTP verified successfully." });
});

//
// 5️⃣ ADMIN RESET PASSWORD
//
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword)
      return res.status(400).json({ success: false, message: "Email and new password required." });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(404).json({ success: false, message: "Admin not found." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    delete adminOtpStore[email];

    return res.json({ success: true, message: "Password reset successful! You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Error resetting password." });
  }
});

// ======================
// ADMIN DASHBOARD STATS
// ======================

router.get("/dashboard/stats", async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const totalDonors = await Donor.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: "Approved" });
    const pendingCampaigns = await Campaign.countDocuments({ status: "Pending" });

    // Get campaigns over time (last 7 months)
    const now = new Date();
    const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const campaignsOverTime = await Campaign.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Get donations per category
    const donationsPerCategory = await Campaign.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent campaigns for status overview
    const recentCampaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title category donationType createdAt status beneficiaryName");

    // Get recent donations
    const recentDonations = await Donation.find()
      .populate("driveId", "title category")
      .sort({ createdAt: -1 })
      .limit(10)
      .select("donor driveId type cashAmount goodsDescription createdAt");

    res.json({
      success: true,
      stats: {
        totalCampaigns,
        totalDonors,
        activeCampaigns,
        pendingCampaigns,
      },
      campaignsOverTime,
      donationsPerCategory,
      recentCampaigns,
      recentDonations,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// CAMPAIGN MANAGEMENT
// ======================

// Get all campaigns for admin (all statuses)
router.get("/campaigns", authMiddleware, hasPermission(PERMISSIONS.VIEW_CAMPAIGNS), async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve campaign
router.put("/campaigns/:id/approve", authMiddleware, hasPermission(PERMISSIONS.APPROVE_CAMPAIGN), async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: "Approved" },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Campaign Approved",
      details: `Approved campaign: ${campaign.title}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    res.json({ success: true, message: "Campaign approved", campaign });
  } catch (error) {
    console.error("Error approving campaign:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reject campaign
router.put("/campaigns/:id/reject", authMiddleware, hasPermission(PERMISSIONS.REJECT_CAMPAIGN), async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected" },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Campaign Rejected",
      details: `Rejected campaign: ${campaign.title}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    res.json({ success: true, message: "Campaign rejected", campaign });
  } catch (error) {
    console.error("Error rejecting campaign:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Archive campaign (soft delete - set status to Archived)
router.put("/campaigns/:id/archive", authMiddleware, hasPermission(PERMISSIONS.DELETE_CAMPAIGN), async (req, res) => {
  try {
    const { archiveReason, adminId, adminName } = req.body;
    
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: "Archived" },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: adminId || "system",
      userName: adminName || "Admin",
      action: "Campaign Archived",
      details: `Archived campaign: ${campaign.title}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    // Send email notification to campaign creator
    if (campaign.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: campaign.email,
          subject: `Campaign Archived: ${campaign.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">Campaign Archive Notification</h2>
              <p>Dear Campaign Creator,</p>
              <p>We are writing to inform you that your campaign <strong>"${campaign.title}"</strong> has been archived by an administrator.</p>
              ${archiveReason ? `<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Reason for archiving:</strong></p>
                <p style="margin: 5px 0 0 0;">${archiveReason}</p>
              </div>` : ''}
              <p>If you have any questions or concerns, please contact the administration.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">This is an automated message from the Student Donation Drive Management System.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Archive notification email sent to ${campaign.email}`);
      } catch (emailError) {
        console.error("Error sending archive notification email:", emailError);
        // Don't fail the archive operation if email fails
      }
    }

    res.json({ success: true, message: "Campaign archived", campaign });
  } catch (error) {
    console.error("Error archiving campaign:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Restore archived campaign (change status back to Pending)
router.put("/campaigns/:id/restore", async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: "Pending" },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Campaign Restored",
      details: `Restored campaign: ${campaign.title}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    res.json({ success: true, message: "Campaign restored to Pending", campaign });
  } catch (error) {
    console.error("Error restoring campaign:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Permanently delete campaign
router.delete("/campaigns/:id", authMiddleware, hasPermission(PERMISSIONS.DELETE_CAMPAIGN), async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Only allow deletion of archived campaigns
    if (campaign.status !== "Archived") {
      return res.status(400).json({ 
        success: false, 
        message: "Only archived campaigns can be permanently deleted" 
      });
    }

    // Log activity before deletion
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Campaign Deleted",
      details: `Permanently deleted campaign: ${campaign.title}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    // Delete the campaign
    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Campaign permanently deleted" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// REPORTS
// ======================

// Get donation reports
router.get("/reports/donations", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, category, campaignId } = req.query;
    
    // Generate unique report ID
    const reportId = `RPT-DONATION-${Date.now()}`;
    
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    if (campaignId) matchQuery.driveId = campaignId;

    const donations = await Donation.find(matchQuery)
      .populate("driveId", "title category")
      .populate("donorId", "name email contactNumber address")
      .sort({ createdAt: -1 });

    // Filter by category if provided
    let filteredDonations = donations;
    if (category) {
      filteredDonations = donations.filter(d => d.driveId?.category === category);
    }

    // Ensure cashAmount is numeric and properly formatted (NO HASHING)
    const processedDonations = filteredDonations.map(d => {
      const obj = d.toObject();
      const cashAmt = parseFloat(String(obj.cashAmount || 0).replace(/[^\d.-]/g, "")) || 0;
      return {
        ...obj,
        cashAmount: cashAmt,
        _id: obj._id?.toString(),
        driveId: obj.driveId ? {
          ...obj.driveId,
          _id: obj.driveId._id?.toString()
        } : null,
        donorId: obj.donorId ? {
          ...obj.donorId,
          _id: obj.donorId._id?.toString()
        } : null
      };
    });

    // Calculate totals with clean numbers
    const totalCash = filteredDonations.reduce((sum, d) => {
      const amount = parseFloat(String(d.cashAmount || 0).replace(/[^\d.-]/g, "")) || 0;
      return sum + (d.type?.toLowerCase().includes("cash") ? amount : 0);
    }, 0);
    
    const totalDonations = filteredDonations.length;
    const cashDonations = filteredDonations.filter(d => d.type?.toLowerCase().includes("cash")).length;
    const goodsDonations = filteredDonations.filter(d => d.type?.toLowerCase().includes("goods")).length;

    res.json({
      success: true,
      reportId,
      generatedAt: new Date().toISOString(),
      total: totalDonations,
      totalAmount: Math.round(totalCash * 100) / 100,
      averageAmount: Math.round((totalDonations > 0 ? totalCash / totalDonations : 0) * 100) / 100,
      summary: {
        totalDonations,
        totalCash: Math.round(totalCash * 100) / 100,
        cashDonations,
        goodsDonations,
      },
      donations: processedDonations,
    });
  } catch (error) {
    console.error("Error fetching donation reports:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get campaign reports
router.get("/reports/campaigns", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, status, category } = req.query;
    
    // Generate unique report ID
    const reportId = `RPT-CAMPAIGN-${Date.now()}`;
    
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    if (status) matchQuery.status = status;
    if (category) matchQuery.category = category;

    const campaigns = await Campaign.find(matchQuery).sort({ createdAt: -1 });

    // Process campaigns to ensure all numeric values are clean (NO HASHING)
    const processedCampaigns = campaigns.map(c => {
      const obj = c.toObject();
      const goalAmt = parseFloat(String(obj.goalAmount || 0).replace(/[^\d.-]/g, "")) || 0;
      const currentAmt = parseFloat(String(obj.currentAmount || 0).replace(/[^\d.-]/g, "")) || 0;
      const progress = goalAmt > 0 ? ((currentAmt / goalAmt) * 100) : 0;
      
      return {
        ...obj,
        goalAmount: Math.round(goalAmt * 100) / 100,
        currentAmount: Math.round(currentAmt * 100) / 100,
        progressPercentage: Math.round(progress * 100) / 100,
        _id: obj._id?.toString()
      };
    });

    const totalCampaigns = campaigns.length;
    const totalGoal = Math.round(campaigns.reduce((sum, c) => {
      const amt = parseFloat(String(c.goalAmount || 0).replace(/[^\d.-]/g, "")) || 0;
      return sum + amt;
    }, 0) * 100) / 100;
    
    const totalRaised = Math.round(campaigns.reduce((sum, c) => {
      const amt = parseFloat(String(c.currentAmount || 0).replace(/[^\d.-]/g, "")) || 0;
      return sum + amt;
    }, 0) * 100) / 100;
    
    const approvedCampaigns = campaigns.filter(c => c.status === "Approved").length;
    const pendingCampaigns = campaigns.filter(c => c.status === "Pending").length;
    const completionRate = totalGoal > 0 
      ? Math.round((totalRaised / totalGoal) * 10000) / 100
      : 0;

    res.json({
      success: true,
      reportId,
      generatedAt: new Date().toISOString(),
      total: totalCampaigns,
      totalGoal,
      totalRaised,
      averageGoal: totalCampaigns > 0 ? Math.round((totalGoal / totalCampaigns) * 100) / 100 : 0,
      summary: {
        totalCampaigns,
        totalGoal,
        totalRaised,
        approvedCampaigns,
        pendingCampaigns,
        completionRate,
      },
      campaigns: processedCampaigns,
    });
  } catch (error) {
    console.error("Error fetching campaign reports:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// CATEGORY MANAGEMENT
// ======================

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create category
router.post("/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description || "",
    });

    await newCategory.save();

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Category Created",
      details: `Created category: ${name}`,
      resourceType: "category",
      resourceId: newCategory._id.toString(),
    });

    res.json({ success: true, message: "Category created successfully", category: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update category
router.put("/categories/:id", async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: "Category name already exists" });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Category Updated",
      details: `Updated category: ${category.name}`,
      resourceType: "category",
      resourceId: category._id.toString(),
    });

    res.json({ success: true, message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Check if category is used in campaigns
    const campaignsUsingCategory = await Campaign.countDocuments({ category: category.name });
    if (campaignsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used in ${campaignsUsingCategory} campaign(s).`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Category Deleted",
      details: `Deleted category: ${category.name}`,
      resourceType: "category",
      resourceId: category._id.toString(),
    });

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// ACTIVITY LOGS
// ======================

// Get activity logs
router.get("/activity-logs", async (req, res) => {
  try {
    const { userType, resourceType, startDate, endDate, limit = 100 } = req.query;
    
    let matchQuery = {};
    if (userType) matchQuery.userType = userType;
    if (resourceType) matchQuery.resourceType = resourceType;
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Enhance logs with user profile images
    const enhancedLogs = await Promise.all(
      logs.map(async (log) => {
        let userImage = null;

        try {
          // Skip if userId is "system" or empty
          if (log.userId === 'system' || !log.userId) {
            return {
              ...log.toObject(),
              userImage: null,
            };
          }

          if (log.userType === 'admin') {
            const admin = await Admin.findById(log.userId).select('profileImage avatar name');
            userImage = admin?.profileImage || admin?.avatar || null;
          } else if (log.userType === 'donor') {
            const donor = await Donor.findById(log.userId).select('avatar profileImage name');
            userImage = donor?.avatar || donor?.profileImage || null;
          }
        } catch (err) {
          // Silently skip errors for invalid ObjectIds
        }

        return {
          ...log.toObject(),
          userImage: userImage,
        };
      })
    );

    res.json({ success: true, logs: enhancedLogs });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// DONOR MANAGEMENT
// ======================

// Get all donors
router.get("/donors", async (req, res) => {
  try {
    const donors = await Donor.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    // Get donation counts for each donor
    const donorsWithStats = await Promise.all(
      donors.map(async (donor) => {
        const donationCount = await Donation.countDocuments({ "donor.email": donor.email });
        const totalDonated = await Donation.aggregate([
          { $match: { "donor.email": donor.email } },
          { $group: { _id: null, total: { $sum: "$cashAmount" } } },
        ]);
        
        return {
          ...donor.toObject(),
          donationCount,
          totalDonated: totalDonated[0]?.total || 0,
        };
      })
    );

    res.json({ success: true, donors: donorsWithStats });
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get donor details
router.get("/donors/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).select("-password");
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    const donations = await Donation.find({ "donor.email": donor.email })
      .populate("driveId", "title category status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      donor,
      donations,
      stats: {
        totalDonations: donations.length,
        totalAmount: donations.reduce((sum, d) => sum + (Number(d.cashAmount) || 0), 0),
      },
    });
  } catch (error) {
    console.error("Error fetching donor details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update donor (admin can update donor info)
router.put("/donors/:id", async (req, res) => {
  try {
    const { name, contactNumber, address, isActive } = req.body;
    
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    if (name) donor.name = name;
    if (contactNumber !== undefined) donor.contactNumber = contactNumber;
    if (address !== undefined) donor.address = address;

    await donor.save();

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.body.adminId || "system",
      userName: req.body.adminName || "Admin",
      action: "Donor Updated",
      details: `Updated donor: ${donor.email}`,
      resourceType: "donor",
      resourceId: donor._id.toString(),
    });

    res.json({ success: true, message: "Donor updated successfully", donor });
  } catch (error) {
    console.error("Error updating donor:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// ADMIN PROFILE & SETTINGS
// ======================

// Get admin profile
router.get("/profile", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("-password");
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({ success: true, admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update admin profile (protected)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { email, name, profileImage, contactNumber, address, avatar } = req.body;
    
    console.log("📝 Admin profile update request:", { email, name, contactNumber, address });
    
    // Validate email
    if (!email || typeof email !== "string" || email.trim() === "") {
      console.log("❌ Email validation failed:", email);
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      console.log("❌ Admin not found:", email);
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    console.log("✅ Found admin:", admin.email);

    // Update fields - handles both Google Auth and regular signup
    if (name && typeof name === "string") {
      admin.name = name;
      console.log("📝 Updated name to:", name);
    }
    if (profileImage !== undefined) {
      admin.profileImage = profileImage;
      console.log("📝 Updated profileImage");
    }
    if (contactNumber !== undefined) {
      admin.contactNumber = contactNumber;
      console.log("📝 Updated contact to:", contactNumber);
    }
    if (address !== undefined) {
      admin.address = address;
      console.log("📝 Updated address to:", address);
    }
    if (avatar !== undefined) {
      admin.avatar = avatar;
      console.log("📝 Updated avatar");
    }

    await admin.save();
    console.log("✅ Admin saved to database");

    // Log admin profile update
    await ActivityLog.create({
      userType: "admin",
      userId: admin._id.toString(),
      userName: admin.name,
      action: "Profile Updated",
      details: `Updated profile information for admin: ${admin.email}`,
      resourceType: "system",
      resourceId: admin._id.toString(),
    });

    console.log("✅ Activity log created");

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        profileImage: admin.profileImage,
        contactNumber: admin.contactNumber,
        address: admin.address,
        avatar: admin.avatar,
        createdAt: admin.createdAt,
      },
    });

    console.log("✅ Response sent successfully");
  } catch (error) {
    console.error("❌ Error updating admin profile:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// Change admin password
router.put("/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, current password, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (!admin.password) {
      return res.status(400).json({
        success: false,
        message: "This account was registered with Google. Cannot change password.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//
// ============================================
// RBAC - ADMIN MANAGEMENT ROUTES
// ============================================
// All these routes require SuperAdmin privileges
//

/**
 * Get all admins
 * GET /api/admin/rbac/admins
 * Protected: SuperAdmin only
 */
router.get("/rbac/admins", authMiddleware, onlySuperAdmin, adminController.getAllAdmins);

/**
 * Get admin by ID
 * GET /api/admin/rbac/admins/:id
 * Protected: SuperAdmin only
 */
router.get("/rbac/admins/:id", authMiddleware, onlySuperAdmin, adminController.getAdminById);

/**
 * Create new admin
 * POST /api/admin/rbac/admins
 * Protected: SuperAdmin only
 * Body: { name, email, password, role, permissions }
 */
router.post("/rbac/admins", authMiddleware, onlySuperAdmin, adminController.createAdmin);

/**
 * Update admin
 * PUT /api/admin/rbac/admins/:id
 * Protected: SuperAdmin only
 * Body: { role, permissions, accessLevel, isActive }
 */
router.put("/rbac/admins/:id", authMiddleware, onlySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions, accessLevel, isActive } = req.body;

    // Validate role
    if (role && !["Admin", "SuperAdmin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'Admin' or 'SuperAdmin'",
      });
    }

    // Can't change your own role
    if (id === req.admin.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot change your own role",
      });
    }

    // Find admin
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Update fields
    if (role) admin.role = role;
    if (permissions && Array.isArray(permissions)) admin.permissions = permissions;
    if (accessLevel !== undefined) admin.accessLevel = accessLevel;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        accessLevel: admin.accessLevel,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ success: false, message: "Failed to update admin" });
  }
});

/**
 * Delete admin
 * DELETE /api/admin/rbac/admins/:id
 * Protected: SuperAdmin only
 */
router.delete("/rbac/admins/:id", authMiddleware, onlySuperAdmin, adminController.deleteAdmin);

/**
 * Grant permissions to admin
 * POST /api/admin/rbac/admins/:id/permissions/grant
 * Protected: SuperAdmin only
 * Body: { permissions: ["permission1", "permission2", ...] }
 */
router.post(
  "/rbac/admins/:id/permissions/grant",
  authMiddleware,
  onlySuperAdmin,
  adminController.grantPermissions
);

/**
 * Revoke permissions from admin
 * POST /api/admin/rbac/admins/:id/permissions/revoke
 * Protected: SuperAdmin only
 * Body: { permissions: ["permission1", "permission2", ...] }
 */
router.post(
  "/rbac/admins/:id/permissions/revoke",
  authMiddleware,
  onlySuperAdmin,
  adminController.revokePermissions
);

/**
 * Get available roles
 * GET /api/admin/rbac/roles
 * Protected: SuperAdmin only
 */
router.get("/rbac/roles", authMiddleware, onlySuperAdmin, (req, res) => {
  try {
    const roles = Object.values(ADMIN_ROLES);
    res.json({ success: true, roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get available permissions and roles
 * GET /api/admin/rbac/permissions
 * Protected: SuperAdmin only
 */
router.get("/rbac/permissions", authMiddleware, onlySuperAdmin, adminController.getAvailablePermissions);

// ======================
// ADMIN MANAGEMENT (SUPERADMIN ONLY)
// ======================

/**
 * GET /api/admin/all-admins
 * Get all admins with their roles and permissions
 * Protected: SuperAdmin only
 */
router.get("/all-admins", authMiddleware, onlySuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    
    const adminList = admins.map(admin => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accessLevel: admin.accessLevel,
      permissions: admin.permissions || [],
      contactNumber: admin.contactNumber,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }));

    res.json({ success: true, admins: adminList });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUT /api/admin/update-admin-role/:adminId
 * Update admin role and permissions
 * Protected: SuperAdmin only
 * Uses MongoDB transactions for atomic operations
 */
router.put("/update-admin-role/:adminId", authMiddleware, onlySuperAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { adminId } = req.params;
    const { role, permissions, accessLevel } = req.body;

    // Validate role
    if (!["Admin", "SuperAdmin"].includes(role)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const admin = await Admin.findById(adminId).session(session);
    if (!admin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Prevent downgrading the only SuperAdmin
    if (admin.role === "SuperAdmin" && role === "Admin") {
      const superAdminCount = await Admin.countDocuments({ role: "SuperAdmin" }).session(session);
      if (superAdminCount === 1) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Cannot downgrade the only SuperAdmin. Please create another SuperAdmin first." 
        });
      }
    }

    // Update admin
    admin.role = role;
    
    // If SuperAdmin, give all permissions
    if (role === "SuperAdmin") {
      admin.permissions = Object.values(PERMISSIONS);
      admin.accessLevel = 100;
    } else {
      // For regular admins, set custom permissions and access level
      if (permissions && Array.isArray(permissions)) {
        admin.permissions = permissions;
      }
      if (accessLevel !== undefined && accessLevel >= 0 && accessLevel <= 100) {
        admin.accessLevel = accessLevel;
      }
    }

    // Increment version for optimistic concurrency control
    admin.version = (admin.version || 0) + 1;

    await admin.save({ session });

    // Log activity within the same transaction
    await ActivityLog.create(
      [{
        userType: "admin",
        userId: req.admin.id,
        userName: req.user.name || "SuperAdmin",
        action: "Admin Role Updated",
        details: `Updated ${admin.email} role to ${role}`,
        resourceType: "system",
        resourceId: admin._id.toString(),
      }],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ 
      success: true, 
      message: "Admin role updated successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        accessLevel: admin.accessLevel,
        permissions: admin.permissions,
        version: admin.version,
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating admin role:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUT /api/admin/update-admin-permissions/:adminId
 * Update admin permissions and access level
 * Protected: SuperAdmin only
 * Uses MongoDB transactions for atomic operations
 */
router.put("/update-admin-permissions/:adminId", authMiddleware, onlySuperAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { adminId } = req.params;
    const { permissions, accessLevel } = req.body;

    const admin = await Admin.findById(adminId).session(session);
    if (!admin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Cannot modify SuperAdmin permissions (they have all permissions)
    if (admin.role === "SuperAdmin") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Cannot modify SuperAdmin permissions" 
      });
    }

    // Update permissions
    if (permissions && Array.isArray(permissions)) {
      const validPermissions = Object.values(PERMISSIONS);
      const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
      
      if (invalidPerms.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Invalid permissions: ${invalidPerms.join(", ")}` 
        });
      }
      
      admin.permissions = permissions;
    }

    // Update access level
    if (accessLevel !== undefined) {
      if (accessLevel < 0 || accessLevel > 100) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Access level must be between 0 and 100" 
        });
      }
      admin.accessLevel = accessLevel;
    }

    // Increment version for optimistic concurrency control
    admin.version = (admin.version || 0) + 1;

    await admin.save({ session });

    // Log activity within the same transaction
    await ActivityLog.create(
      [{
        userType: "admin",
        userId: req.admin.id,
        userName: req.user.name || "SuperAdmin",
        action: "Admin Permissions Updated",
        details: `Updated permissions for ${admin.email}`,
        resourceType: "system",
        resourceId: admin._id.toString(),
      }],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ 
      success: true, 
      message: "Admin permissions updated successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        accessLevel: admin.accessLevel,
        permissions: admin.permissions,
        version: admin.version,
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating admin permissions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /api/admin/available-permissions
 * Get all available permissions for selection
 * Protected: SuperAdmin only
 */
router.get("/available-permissions", authMiddleware, onlySuperAdmin, async (req, res) => {
  try {
    const permissionsList = Object.entries(PERMISSIONS).map(([key, value]) => ({
      key: key,
      value: value,
      label: key.replace(/_/g, " ").toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));

    res.json({ success: true, permissions: permissionsList });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUT /api/admin/deactivate-admin/:adminId
 * Deactivate an admin account
 * Protected: SuperAdmin only
 */
router.put("/deactivate-admin/:adminId", authMiddleware, onlySuperAdmin, async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Prevent deactivating the only SuperAdmin
    if (admin.role === "SuperAdmin") {
      const superAdminCount = await Admin.countDocuments({ role: "SuperAdmin" });
      if (superAdminCount === 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot deactivate the only SuperAdmin" 
        });
      }
    }

    // Add isActive field to disable the admin
    admin.isActive = false;
    await admin.save();

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.admin.id,
      userName: req.user.name || "SuperAdmin",
      action: "Admin Deactivated",
      details: `Deactivated admin: ${admin.email}`,
      resourceType: "system",
      resourceId: admin._id.toString(),
    });

    res.json({ 
      success: true, 
      message: "Admin deactivated successfully"
    });
  } catch (error) {
    console.error("Error deactivating admin:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUT /api/admin/activate-admin/:adminId
 * Activate a deactivated admin account
 * Protected: SuperAdmin only
 */
router.put("/activate-admin/:adminId", authMiddleware, onlySuperAdmin, async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    admin.isActive = true;
    await admin.save();

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.admin.id,
      userName: req.user.name || "SuperAdmin",
      action: "Admin Activated",
      details: `Activated admin: ${admin.email}`,
      resourceType: "system",
      resourceId: admin._id.toString(),
    });

    res.json({ 
      success: true, 
      message: "Admin activated successfully"
    });
  } catch (error) {
    console.error("Error activating admin:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// PDF STORAGE ENDPOINTS
// ======================

// Save PDF Report to Server (Multi-user access)
router.post("/reports/save-pdf", authMiddleware, async (req, res) => {
  try {
    const { pdfData, reportType, reportId, fileName, metadata, filters } = req.body;
    const adminData = req.admin;

    if (!pdfData || !reportType || !reportId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: pdfData, reportType, reportId"
      });
    }

    // Import ReportStorage model
    const ReportStorage = (await import("../models/ReportStorage.js")).default;

    // Check if report already exists
    const existingReport = await ReportStorage.findOne({ reportId });
    if (existingReport) {
      existingReport.pdfData = pdfData;
      existingReport.metadata = metadata;
      existingReport.accessLog.push({
        accessedBy: adminData.id,
        accessedAt: new Date()
      });
      await existingReport.save();
      
      return res.json({
        success: true,
        message: "Report updated successfully",
        reportId,
        downloadUrl: `/api/admin/reports/download-pdf/${reportId}`
      });
    }

    // Create new report storage
    const newReport = new ReportStorage({
      reportId,
      reportType,
      adminId: adminData.id,
      adminName: adminData.name,
      pdfData,
      fileName,
      fileSize: Buffer.byteLength(pdfData, 'base64'),
      metadata: {
        ...metadata,
        generatedDate: new Date(),
        filters
      },
      accessLog: [{
        accessedBy: adminData.id,
        accessedAt: new Date()
      }]
    });

    await newReport.save();

    res.json({
      success: true,
      message: "Report saved successfully",
      reportId,
      downloadUrl: `/api/admin/reports/download-pdf/${reportId}`
    });
  } catch (error) {
    console.error("Error saving PDF report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Download PDF Report (Multi-user access)
router.get("/reports/download-pdf/:reportId", authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;
    const adminData = req.admin;

    const ReportStorage = (await import("../models/ReportStorage.js")).default;

    const report = await ReportStorage.findOne({ reportId, status: "active" });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Log access
    report.accessLog.push({
      accessedBy: adminData.id,
      accessedAt: new Date()
    });
    await report.save();

    // Convert base64 to buffer and send as PDF
    const pdfBuffer = Buffer.from(report.pdfData, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error downloading PDF report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all saved reports (for history/list)
router.get("/reports/history", authMiddleware, async (req, res) => {
  try {
    const { reportType } = req.query;

    const ReportStorage = (await import("../models/ReportStorage.js")).default;

    let query = { status: "active" };
    if (reportType) query.reportType = reportType;

    const reports = await ReportStorage.find(query)
      .select("reportId reportType fileName createdAt adminName accessLog")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error fetching report history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete/Archive Report
router.delete("/reports/:reportId", authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;

    const ReportStorage = (await import("../models/ReportStorage.js")).default;

    const report = await ReportStorage.findOne({ reportId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    report.status = "archived";
    await report.save();

    res.json({
      success: true,
      message: "Report archived successfully"
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
