import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import SuperAdmin from "../models/SuperAdmin.js";
import Admin from "../models/Admin.js";
import authMiddleware from "../middleware/auth.js";
import ActivityLog from "../models/ActivityLog.js";

dotenv.config();
const router = express.Router();

// ============================================
// SUPERADMIN AUTHENTICATION
// ============================================

/**
 * SuperAdmin Login
 * POST /api/superadmin/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Try to find SuperAdmin in SuperAdmin collection first
    let superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    
    // If not found in SuperAdmin collection, check Admin collection for SuperAdmin role
    if (!superAdmin) {
      const adminSuperAdmin = await Admin.findOne({ 
        email: email.toLowerCase(),
        role: "SuperAdmin" 
      });
      
      if (adminSuperAdmin) {
        superAdmin = adminSuperAdmin;
      }
    }

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!superAdmin.isActive && superAdmin.isActive !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error("❌ FATAL ERROR: JWT_SECRET not set in .env file");
      return res.status(500).json({ message: "Server configuration error" });
    }
    const token = jwt.sign(
      { id: superAdmin._id, role: "SuperAdmin", email: superAdmin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update last login
    if (superAdmin.updateOne && typeof superAdmin.updateOne === 'function') {
      // If it's a Mongoose document, use save
      superAdmin.lastLogin = new Date();
      await superAdmin.save();
    } else {
      // Fallback: use findByIdAndUpdate
      await Admin.findByIdAndUpdate(superAdmin._id, {
        lastLogin: new Date(),
      });
    }

    // Log activity
    await ActivityLog.create({
      userName: superAdmin.name,
      userType: "admin", // Use valid enum value
      userId: superAdmin._id.toString(),
      action: "Login",
      resourceType: "system", // Use valid enum value
      details: `SuperAdmin ${superAdmin.name} logged in`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role || "SuperAdmin",
        permissions: superAdmin.permissions,
        profileImage: superAdmin.profileImage,
        accessLevel: superAdmin.accessLevel || 100,
      },
    });
  } catch (error) {
    console.error("SuperAdmin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

/**
 * SuperAdmin Registration (Protected - Only existing SuperAdmins can register new ones)
 * POST /api/superadmin/register
 */
router.post("/register", authMiddleware, async (req, res) => {
  try {
    // Verify the user is a SuperAdmin
    const existingSuperAdmin = await SuperAdmin.findById(req.user.id);
    if (!existingSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmins can register new SuperAdmins",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if email already exists
    const existingEmail = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as SuperAdmin",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new SuperAdmin
    const newSuperAdmin = new SuperAdmin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newSuperAdmin.save();

    // Log activity
    await ActivityLog.create({
      userName: existingSuperAdmin.name,
      userType: "admin",
      action: "Create SuperAdmin",
      resourceType: "system",
      details: `SuperAdmin created new SuperAdmin account for ${name}`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "SuperAdmin registration successful",
      superAdmin: {
        id: newSuperAdmin._id,
        name: newSuperAdmin.name,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
      },
    });
  } catch (error) {
    console.error("SuperAdmin registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

/**
 * Get SuperAdmin Profile
 * GET /api/superadmin/profile
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findById(req.user.id).select(
      "-password"
    );

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "SuperAdmin not found",
      });
    }

    return res.json({
      success: true,
      data: superAdmin,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Update SuperAdmin Profile
 * PUT /api/superadmin/profile
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, contactNumber, address, city, zipCode, profileImage } =
      req.body;

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      req.user.id,
      {
        name,
        contactNumber,
        address,
        city,
        zipCode,
        profileImage,
      },
      { new: true }
    ).select("-password");

    // Log activity
    await ActivityLog.create({
      userName: superAdmin.name,
      userType: "admin",
      action: "Update Profile",
      resourceType: "system",
      details: `SuperAdmin updated profile`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: superAdmin,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Change SuperAdmin Password
 * POST /api/superadmin/change-password
 */
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "SuperAdmin not found",
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, superAdmin.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    superAdmin.password = hashedPassword;
    await superAdmin.save();

    // Log activity
    await ActivityLog.create({
      userName: superAdmin.name,
      userType: "admin",
      action: "Change Password",
      resourceType: "system",
      details: `SuperAdmin changed password`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Get All SuperAdmins (Protected - Only SuperAdmins)
 * GET /api/superadmin/all
 */
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const requester = await SuperAdmin.findById(req.user.id);
    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const superAdmins = await SuperAdmin.find().select("-password");

    return res.json({
      success: true,
      count: superAdmins.length,
      data: superAdmins,
    });
  } catch (error) {
    console.error("Error fetching SuperAdmins:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Deactivate SuperAdmin Account (Protected - Only SuperAdmins)
 * POST /api/superadmin/deactivate/:id
 */
router.post("/deactivate/:id", authMiddleware, async (req, res) => {
  try {
    const requester = await SuperAdmin.findById(req.user.id);
    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    // Log activity
    await ActivityLog.create({
      userName: requester.name,
      userType: "admin",
      action: "Deactivate SuperAdmin",
      resourceType: "system",
      details: `SuperAdmin deactivated account for ${superAdmin.name}`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "SuperAdmin deactivated",
      data: superAdmin,
    });
  } catch (error) {
    console.error("Error deactivating SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Reactivate SuperAdmin Account (Protected - Only SuperAdmins)
 * POST /api/superadmin/activate/:id
 */
router.post("/activate/:id", authMiddleware, async (req, res) => {
  try {
    const requester = await SuperAdmin.findById(req.user.id);
    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    // Log activity
    await ActivityLog.create({
      userName: requester.name,
      userType: "admin",
      action: "Activate SuperAdmin",
      resourceType: "system",
      details: `SuperAdmin activated account for ${superAdmin.name}`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "SuperAdmin activated",
      data: superAdmin,
    });
  } catch (error) {
    console.error("Error activating SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Convert Admin to SuperAdmin (Protected - Only SuperAdmins)
 * POST /api/superadmin/convert-admin
 * 
 * Converts an existing admin account to a SuperAdmin account
 * by creating a new SuperAdmin entry in the SuperAdmin collection
 * with the same credentials.
 */
router.post("/convert-admin", authMiddleware, async (req, res) => {
  try {
    // Verify the requester is a SuperAdmin
    const requester = await SuperAdmin.findById(req.user.id);
    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmins can perform this action",
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Admin email is required",
      });
    }

    // Find the admin in Admin collection
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if already exists as SuperAdmin
    const existingSuperAdmin = await SuperAdmin.findOne({ 
      email: email.toLowerCase() 
    });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: "This email already exists as a SuperAdmin",
      });
    }

    // Create new SuperAdmin entry with admin's data
    const newSuperAdmin = new SuperAdmin({
      name: admin.name,
      email: admin.email.toLowerCase(),
      password: admin.password, // Use the same password hash
      role: "SuperAdmin",
      permissions: [
        "create_campaign",
        "view_campaigns",
        "approve_campaign",
        "reject_campaign",
        "delete_campaign",
        "edit_campaign",
        "view_donations",
        "manage_donations",
        "create_admin",
        "view_admins",
        "edit_admin",
        "delete_admin",
        "view_donors",
        "manage_donors",
        "manage_categories",
        "view_activity_logs",
        "manage_system_settings",
      ],
      accessLevel: 100,
      profileImage: admin.profileImage || null,
      contactNumber: admin.contactNumber || "",
      address: admin.address || "",
      city: admin.city || "",
      zipCode: admin.zipCode || "",
      department: "System Administration",
      isActive: true,
    });

    await newSuperAdmin.save();

    // Log the conversion activity
    await ActivityLog.create({
      userName: requester.name,
      userType: "admin",
      userId: requester._id.toString(),
      action: "Convert Admin to SuperAdmin",
      resourceType: "system",
      details: `SuperAdmin converted admin ${admin.name} (${admin.email}) to SuperAdmin role`,
      status: "success",
    });

    return res.json({
      success: true,
      message: "Admin successfully converted to SuperAdmin",
      superAdmin: {
        id: newSuperAdmin._id,
        name: newSuperAdmin.name,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
        accessLevel: newSuperAdmin.accessLevel,
      },
    });
  } catch (error) {
    console.error("Error converting admin to SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

export default router;
