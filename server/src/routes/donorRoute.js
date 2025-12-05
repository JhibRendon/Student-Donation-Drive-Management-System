  // routes/donor_reg.js
  import express from "express";
  import bcrypt from "bcryptjs";
  import jwt from "jsonwebtoken";
  import dotenv from "dotenv";
  import Donor from "../models/Donor.js";
  import Admin from "../models/Admin.js";
  import Campaign from "../models/Campaign.js";
  import Donation from "../models/Donation.js"; 
  import ActivityLog from "../models/ActivityLog.js";
  import Notification from "../models/Notification.js";

  dotenv.config();
  const router = express.Router();

  // ======================
  // DONOR AUTH ROUTES
  // ======================

  // Register donor
  router.post("/register", async (req, res) => {
    try {
      let { name, email, password } = req.body;

      // Validate and normalize inputs
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      // Trim and normalize
      name = name.trim();
      email = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email address" });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
      }

      // Check if email exists in Admin
      const adminExists = await Admin.findOne({ email });
      if (adminExists) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered as an Admin. Cannot register as Donor."
        });
      }

      // Check if email exists in Donor
      const donorExists = await Donor.findOne({ email });
      if (donorExists) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered as a Donor. Please login instead."
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new donor
      const newDonor = new Donor({ 
        name, 
        email, 
        password: hashedPassword 
      });
      
      await newDonor.save();

      // Log donor registration
      await ActivityLog.create({
        userType: "donor",
        userId: newDonor._id.toString(),
        userName: newDonor.name,
        action: "Donor Registered",
        details: `Registered with email: ${newDonor.email}`,
        resourceType: "donor",
        resourceId: newDonor._id.toString(),
      });

      res.json({ 
        success: true, 
        message: "Donor registration successful! You can now login." 
      });
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle duplicate key error (MongoDB)
      if (err.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          message: "This email is already registered." 
        });
      }

      // Handle validation errors
      if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map(e => e.message).join(", ");
        return res.status(400).json({ 
          success: false, 
          message: errors 
        });
      }

      res.status(500).json({ 
        success: false, 
        message: err.message || "Server error. Please try again." 
      });
    }
  });

  // Login donor
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check Admin first
      if (await Admin.findOne({ email })) {
        return res.status(401).json({
          success: false,
          message: "This email is registered as an Admin. Please log in through Admin portal."
        });
      }

      const donor = await Donor.findOne({ email });
      if (!donor) return res.status(401).json({ success: false, message: "Invalid email or password" });

      const isMatch = await bcrypt.compare(password, donor.password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

      // Generate JWT token
      const jwtToken = jwt.sign({ id: donor._id, role: "donor" }, process.env.JWT_SECRET, { expiresIn: "7d" });

      // Log donor login
      await ActivityLog.create({
        userType: "donor",
        userId: donor._id.toString(),
        userName: donor.name,
        action: "Donor Login",
        details: `Logged in with email: ${donor.email}`,
        resourceType: "donor",
        resourceId: donor._id.toString(),
      });

      res.json({
        success: true,
        message: "Donor login successful!",
        token: jwtToken,
        donor: {
          _id: donor._id,
          // Primary fields (consistent format)
          name: donor.name,
          email: donor.email,
          // Alternative fields (for compatibility)
          donorId: donor._id,
          donorName: donor.name,
          donorEmail: donor.email,
          // Avatar fields
          donorAvatar: donor.avatar || donor.profileImage || "",
          avatar: donor.avatar || "",
          profileImage: donor.profileImage || "",
          // Profile fields
          contactNumber: donor.contactNumber || "",
          address: donor.address || "",
          // Metadata
          createdAt: donor.createdAt,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // ======================
  // CAMPAIGN ROUTES
  // ======================

  // Get all campaigns (for explore page) - only shows approved campaigns, excludes campaigns the donor has already donated to
  router.get("/explore", async (req, res) => {
    try {
      // Get donor email from query parameter
      const donorEmail = req.query.donorEmail;
      
      // Only show approved campaigns (admin must approve first)
      // AND only show campaigns that are NOT fully funded (currentAmount < goalAmount)
      let allCampaigns = await Campaign.find({ status: "Approved" });
      
      // Filter out fully funded campaigns (currentAmount >= goalAmount)
      let campaigns = allCampaigns.filter(campaign => {
        // If no goal amount or goal is 0, always show
        if (!campaign.goalAmount || campaign.goalAmount === 0) {
          return true;
        }
        // Only show if currentAmount < goalAmount
        const currentAmount = campaign.currentAmount || 0;
        return currentAmount < campaign.goalAmount;
      });
      
      // If donor email is provided, filter out campaigns they've already donated to
      if (donorEmail) {
        // Find all campaign IDs the donor has donated to
        const donations = await Donation.find({ 
          "donor.email": donorEmail.toLowerCase() 
        });
        
        // Extract campaign IDs, filtering out any null/undefined values
        const donatedCampaignIds = donations
          .filter(d => d.driveId) // Only include donations with valid driveId
          .map(d => d.driveId.toString());
        
        // Filter out campaigns the donor has already donated to
        campaigns = campaigns.filter(campaign => 
          !donatedCampaignIds.includes(campaign._id.toString())
        );
      }
      
      res.json(campaigns);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get single campaign by ID
  router.get("/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findById(id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      res.json(campaign);
    } catch (err) {
      console.error("Error fetching campaign:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ======================
  // DONATION ROUTES
  // ======================

  // Submit a donation
  router.post("/donations", async (req, res) => {
    try {
      const { driveId, type, cashAmount, goodsDescription, goodsPhoto, gcashReceipt, donor, deliveryDate } = req.body;

      if (!driveId || !donor || !donor.email) {
        return res.status(400).json({ success: false, message: "Missing required donation data" });
      }

      // Find donor by email to get donorId
      const donorDoc = await Donor.findOne({ email: donor.email.toLowerCase() });
      if (!donorDoc) {
        return res.status(400).json({ success: false, message: "Donor not found" });
      }

      // Get campaign to check current amount
      const campaign = await Campaign.findById(driveId);
      if (!campaign) {
        return res.status(404).json({ success: false, message: "Campaign not found" });
      }

      const donation = new Donation({
        driveId,
        type,
        cashAmount: cashAmount || 0,
        goodsDescription: goodsDescription || "",
        goodsPhoto: goodsPhoto || "",
        gcashReceipt: gcashReceipt || "",
        donor,
        donorId: donorDoc._id,
        deliveryDate: deliveryDate || null,
        status: "Pending", // Default status
      });

      await donation.save();


      // Log donor donation
      await ActivityLog.create({
        userType: "donor",
        userId: donorDoc._id.toString(),
        userName: donorDoc.name,
        action: "Donation Submitted",
        details: `Donated to campaign: ${campaign.title} | Amount: ${cashAmount || 0}`,
        resourceType: "donation",
        resourceId: donation._id.toString(),
      });

      // Create notification for donor
      try {
        const notification = await Notification.create({
          donorId: donorDoc._id.toString(),
          message: `Your donation to '${campaign.title}' was submitted successfully!`,
          type: "success"
        });
        console.log("[DEBUG] Notification created:", notification);
      } catch (notifErr) {
        console.error("[DEBUG] Error creating notification:", notifErr);
      }

      // Update campaign's currentAmount if cash donation
      let updatedCampaign;
      if (cashAmount && cashAmount > 0) {
        updatedCampaign = await Campaign.findByIdAndUpdate(
          driveId,
          { $inc: { currentAmount: cashAmount } },
          { new: true }
        );
      } else {
        updatedCampaign = campaign;
      }

      // Check if campaign is now fully funded (currentAmount >= goalAmount)
      // If so, update all donations for this campaign to "Complete"
      if (updatedCampaign.goalAmount && updatedCampaign.currentAmount >= updatedCampaign.goalAmount) {
        await Donation.updateMany(
          { driveId: driveId },
          { $set: { status: "Complete" } }
        );
      }

      res.json({ success: true, message: "Donation submitted successfully!" });
    } catch (err) {
      console.error("Error submitting donation:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  router.get("/donations/:donorEmail", async (req, res) => {
    try {
      const { donorEmail } = req.params;
      const donations = await Donation.find({ "donor.email": donorEmail })
        .populate("driveId", "title image shortDescription deadline donationType goalAmount currentAmount category beneficiaryName")
        .sort({ createdAt: -1 }); // Most recent first
      
      // Update donation status based on campaign completion
      for (let donation of donations) {
        if (donation.driveId && donation.driveId.goalAmount && donation.driveId.currentAmount) {
          // If campaign is fully funded, set status to Complete
          if (donation.driveId.currentAmount >= donation.driveId.goalAmount) {
            if (donation.status !== "Complete") {
              donation.status = "Complete";
              await donation.save();
            }
          }
        }
      }
      
      res.json(donations);
    } catch (err) {
      console.error("Error fetching donor donations:", err);
      res.status(500).json({ message: "Server error while fetching donations" });
    }
  });

  // ======================
  // DONOR PROFILE UPDATES
  // ======================

  // Update donor profile (name, email, contact, address, avatar)
  router.put("/profile", async (req, res) => {
    try {
      const { email, name, contactNumber, address, avatar } = req.body;
      
      console.log("📝 Profile update request:", { email, name, contactNumber, address });
      
      // Validate email
      if (!email || typeof email !== "string" || email.trim() === "") {
        console.log("❌ Email validation failed:", email);
        return res.status(400).json({ success: false, message: "Valid email is required" });
      }

      const donor = await Donor.findOne({ email: email.toLowerCase() });
      if (!donor) {
        console.log("❌ Donor not found:", email);
        return res.status(404).json({ success: false, message: "Donor not found" });
      }

      console.log("✅ Found donor:", donor.email);

      // Update fields
      if (name && typeof name === "string") {
        donor.name = name;
        console.log("📝 Updated name to:", name);
      }
      if (contactNumber !== undefined) {
        donor.contactNumber = contactNumber;
        console.log("📝 Updated contact to:", contactNumber);
      }
      if (address !== undefined) {
        donor.address = address;
        console.log("📝 Updated address to:", address);
      }
      if (avatar !== undefined) {
        donor.avatar = avatar;
        console.log("📝 Updated avatar");
      }

      await donor.save();
      console.log("✅ Donor saved to database");

      // Log donor profile update
      await ActivityLog.create({
        userType: "donor",
        userId: donor._id.toString(),
        userName: donor.name,
        action: "Profile Updated",
        details: `Updated profile information for donor: ${donor.email}`,
        resourceType: "donor",
        resourceId: donor._id.toString(),
      });

      console.log("✅ Activity log created");

      res.json({
        success: true,
        message: "Profile updated successfully",
        donor: {
          _id: donor._id,
          name: donor.name,
          email: donor.email,
          contactNumber: donor.contactNumber,
          address: donor.address,
          avatar: donor.avatar,
          profileImage: donor.profileImage,
          createdAt: donor.createdAt,
        },
      });

      console.log("✅ Response sent successfully");
    } catch (error) {
      console.error("❌ Error updating donor profile:", error);
      res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
  });

  // Change donor password
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

      const donor = await Donor.findOne({ email: email.toLowerCase() });
      if (!donor) {
        return res.status(404).json({ success: false, message: "Donor not found" });
      }


      if (!donor.password) {
        return res.status(400).json({
          success: false,
          message: "This account was registered with Google. Cannot change password.",
        });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, donor.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      donor.password = hashedPassword;
      await donor.save();

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // ======================
// GET DONOR PROFILE
// ======================
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findById(id);

    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    res.json({
      success: true,
      donor: {
        _id: donor._id,
        donorId: donor._id,
        donorName: donor.name,
        donorEmail: donor.email,
        donorAvatar: donor.profileImage || donor.avatar || "",
        contactNumber: donor.contactNumber || "",
        address: donor.address || "",
        gender: donor.gender || "",
        birthday: donor.birthday || "",
        profileImage: donor.profileImage || "",
        avatar: donor.avatar || "",
      },
    });
  } catch (err) {
    console.error("Error fetching donor profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST CAMPAIGN SUBMISSION (PUBLIC - NO LOGIN REQUIRED)
// ======================
router.post("/submit-campaign", async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      fullDescription,
      goalAmount,
      category,
      donationType,
      isHighPriority,
      campaignPhoto,
      gcashName,
      gcashNumber,
      gcashQr,
      bankName,
      bankNumber,
      paypalLink,
      acceptedGoods,
      goodsPhoto,
      beneficiaryName,
      email,
      contactNumber,
    } = req.body;

    // Validate required fields
    if (!title || !shortDescription || !fullDescription || !beneficiaryName || !email || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, shortDescription, fullDescription, beneficiaryName, email, contactNumber"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    // Validate goal amount for Cash donations
    if (donationType === "Cash" && (!goalAmount || goalAmount <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Goal amount is required and must be greater than 0 for Cash donations"
      });
    }

    // Create new campaign
    const newCampaign = new Campaign({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      goalAmount: goalAmount || null,
      category: category || "Community",
      donationType: donationType || "Cash",
      isHighPriority: isHighPriority || false,
      campaignPhoto: campaignPhoto || null,
      gcashName: gcashName || null,
      gcashNumber: gcashNumber || null,
      gcashQr: gcashQr || null,
      bankName: bankName || null,
      bankNumber: bankNumber || null,
      paypalLink: paypalLink || null,
      acceptedGoods: acceptedGoods || null,
      goodsPhoto: goodsPhoto || null,
      beneficiaryName: beneficiaryName.trim(),
      email: email.toLowerCase().trim(),
      contactNumber: contactNumber.trim(),
      status: "Pending", // New campaigns start as Pending
      currentAmount: 0,
      donors: 0,
    });

    await newCampaign.save();

    // Log campaign submission
    await ActivityLog.create({
      userType: "public",
      userId: "anonymous",
      userName: beneficiaryName,
      action: "Campaign Submitted",
      details: `New campaign submitted: ${title} by ${email}`,
      resourceType: "campaign",
      resourceId: newCampaign._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Campaign submitted successfully! It will be reviewed by our admins.",
      campaign: {
        _id: newCampaign._id,
        title: newCampaign.title,
        shortDescription: newCampaign.shortDescription,
        fullDescription: newCampaign.fullDescription,
        goalAmount: newCampaign.goalAmount,
        category: newCampaign.category,
        donationType: newCampaign.donationType,
        beneficiaryName: newCampaign.beneficiaryName,
        email: newCampaign.email,
        contactNumber: newCampaign.contactNumber,
        status: newCampaign.status,
        createdAt: newCampaign.createdAt,
      },
    });
  } catch (err) {
    console.error("Error submitting campaign:", err);
    res.status(500).json({ success: false, message: "Server error while submitting campaign" });
  }
});


  export default router;
