// routes/googleAuthRoute.js
import express from "express";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Admin, { ADMIN_ROLES, ROLE_PERMISSIONS } from "../models/Admin.js";
import Donor from "../models/Donor.js";

dotenv.config();
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

router.post("/google", async (req, res) => {
  try {
    console.log("\n🔐 [BACKEND] Google Auth Route - START");
    
    const { token, userType } = req.body;
    
    console.log("📥 Received:", { userType, tokenLength: token?.length });

    if (!token) {
      console.log("❌ No token provided");
      return res.status(400).json({ success: false, message: "No token provided." });
    }

    console.log("🔍 Verifying Google token...");
    // ✅ Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase();

    console.log(`✅ Google Verified: ${normalizedEmail} as ${userType}`);

    // ============================================================
    // ✅ ADMIN LOGIN / REGISTER
    // ============================================================
    if (userType === "admin") {
      console.log("👤 Processing ADMIN login for:", normalizedEmail);
      
      const donorExists = await Donor.findOne({ email: normalizedEmail });
      if (donorExists) {
        console.log("❌ Email already registered as Donor");
        return res.status(403).json({
          success: false,
          message: "This Google account is already registered as a Donor.",
        });
      }

      let admin = await Admin.findOne({ email: normalizedEmail });

      if (!admin) {
        console.log("🆕 Creating new Admin account");
        
        admin = await Admin.create({
          name,
          email: normalizedEmail,
          googleId,
          password: "google-auth",
          profileImage: picture,
          avatar: picture,
          // 🔐 Set RBAC fields explicitly
          role: ADMIN_ROLES.ADMIN,
          permissions: ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN],
          accessLevel: 60, // Default access level for new admins
        });
        console.log("✅ New Admin Created:", normalizedEmail, "with role:", admin.role, "and accessLevel:", admin.accessLevel);
      } else {
        console.log("✅ Existing Admin found");
        
        // 🔧 Normalize role for admins from before RBAC implementation
        if (admin.role === "admin" || !admin.role) {
          admin.role = ADMIN_ROLES.ADMIN;
        }
        
        // Set RBAC fields if missing
        if (!admin.permissions) {
          admin.permissions = ROLE_PERMISSIONS[admin.role];
        }
        if (!admin.accessLevel) {
          admin.accessLevel = admin.role === ADMIN_ROLES.SUPER_ADMIN ? 100 : 60;
        }
        
        // Update googleId and avatar if not already set
        if (!admin.googleId) {
          admin.googleId = googleId;
          await admin.save();
        }
        if (!admin.avatar && picture) {
          admin.avatar = picture;
          await admin.save();
        }
      }

      const jwtToken = generateToken(admin._id, "admin");
      
      const responseData = {
        success: true,
        message: "Admin login successful",
        userType: "admin",
        token: jwtToken,
        admin: {
          _id: admin._id,
          // Primary fields (Google Auth format)
          name: admin.name,
          email: admin.email,
          // Alternative fields (Regular signup format - for compatibility)
          adminName: admin.name,
          adminEmail: admin.email,
          // Avatar fields
          profileImage: admin.profileImage || admin.avatar || "",
          avatar: admin.avatar || admin.profileImage || "",
          // Profile fields
          contactNumber: admin.contactNumber || "",
          address: admin.address || "",
          // 🔐 RBAC fields
          role: admin.role,
          permissions: admin.permissions,
          accessLevel: admin.accessLevel,
          // Metadata
          createdAt: admin.createdAt,
          googleId: admin.googleId,
        },
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          profileImage: admin.profileImage || admin.avatar || "",
          avatar: admin.avatar || admin.profileImage || "",
          // 🔐 RBAC fields for user context
          role: admin.role,
          permissions: admin.permissions,
          accessLevel: admin.accessLevel,
        },
      };
      
      console.log("📤 Sending response with admin email:", responseData.admin.email);
      console.log("🔐 RBAC Info - Role:", admin.role, "Access Level:", admin.accessLevel);
      console.log("✅ [BACKEND] Google Auth Route - COMPLETE\n");
      
      return res.status(200).json(responseData);
    }

// ============================================================
// ✅ DONOR LOGIN / REGISTER
// ============================================================
if (userType === "donor") {
  const adminExists = await Admin.findOne({ email: normalizedEmail });
  if (adminExists) {
    return res.status(403).json({
      success: false,
      message: "This Google account is already registered as an Admin.",
    });
  }

  // Check if donor exists (either from manual registration or previous Google login)
  let donor = await Donor.findOne({ email: normalizedEmail });

  console.log(`🔍 Searching for donor with email: ${normalizedEmail}`);
  
  if (donor) {
    // Donor ALREADY EXISTS! 
    console.log(`✅ FOUND EXISTING DONOR: ${normalizedEmail}`);
    console.log(`   Current data - Name: ${donor.name}, ContactNumber: ${donor.contactNumber}, Address: ${donor.address}`);
    
    // Update googleId if not already set
    if (!donor.googleId) {
      donor.googleId = googleId;
      await donor.save();
      console.log(`✅ Updated existing donor with googleId: ${normalizedEmail}`);
    } else {
      console.log(`✅ Existing donor already has googleId: ${normalizedEmail}`);
    }
    
    // If profile image wasn't set before, update it from Google
    if (!donor.profileImage && picture) {
      donor.profileImage = picture;
      await donor.save();
      console.log(`✅ Updated donor profileImage from Google`);
    }
    
    // If name is empty or "Donor", use Google name
    if (!donor.name || donor.name === "Donor") {
      donor.name = name;
      await donor.save();
      console.log(`✅ Updated donor name from Google: ${name}`);
    }
  } else {
    // Create new donor only if doesn't exist
    console.log(`🆕 No existing donor found. Creating NEW donor for: ${normalizedEmail}`);
    donor = await Donor.create({
      name,
      email: normalizedEmail,
      googleId,
      password: "google-auth",
      profileImage: picture,
      contactNumber: "",
      address: "",
      gender: "",
      birthday: "",
      avatar: picture
    });
    console.log(`🆕 New Donor Created: ${normalizedEmail}`);
  }

  const jwtToken = generateToken(donor._id, "donor");

  // Return ALL profile fields with consistent naming for frontend
  return res.status(200).json({
    success: true,
    message: "Donor login successful",
    userType: "donor",
    token: jwtToken,
    donor: {
      _id: donor._id,
      // Primary fields (Google Auth format)
      name: donor.name,
      email: donor.email,
      // Alternative fields (Regular signup format - for compatibility)
      donorName: donor.name,
      donorEmail: donor.email,
      // Avatar fields
      profileImage: donor.profileImage || donor.avatar || "",
      avatar: donor.avatar || "",
      // Profile fields
      contactNumber: donor.contactNumber || "",
      address: donor.address || "",
      gender: donor.gender || "",
      birthday: donor.birthday || "",
      // Metadata
      createdAt: donor.createdAt,
      googleId: donor.googleId,
    },
    user: {
      _id: donor._id,
      name: donor.name,
      email: donor.email,
      profileImage: donor.profileImage || donor.avatar || "",
      avatar: donor.avatar || "",
      contactNumber: donor.contactNumber || "",
      address: donor.address || "",
      gender: donor.gender || "",
      birthday: donor.birthday || "",
      createdAt: donor.createdAt,
    },
  });
}


    return res.status(400).json({
      success: false,
      message: "Invalid userType (must be admin or donor)",
    });

  } catch (err) {
    console.error("❌ Google Auth Error:", err);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

export default router;
