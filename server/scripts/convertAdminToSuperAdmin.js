#!/usr/bin/env node

/**
 * ============================================
 * QUICK CONVERT ADMIN TO SUPERADMIN SCRIPT
 * ============================================
 * 
 * This script helps quickly convert an existing admin account
 * to a SuperAdmin account by creating a SuperAdmin collection entry.
 * 
 * Usage:
 *   node scripts/convertAdminToSuperAdmin.js <email>
 * 
 * Example:
 *   node scripts/convertAdminToSuperAdmin.js jsbhiloj@gmail.com
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../src/models/Admin.js";
import SuperAdmin from "../src/models/SuperAdmin.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/donation_drive";

async function convertAdminToSuperAdmin(email) {
  try {
    console.log("\n🔄 Admin to SuperAdmin Conversion Script");
    console.log("=========================================");
    console.log(`📧 Email: ${email}`);
    console.log(`🗄️  MongoDB URL: ${MONGODB_URL}`);

    // Connect to MongoDB
    console.log("\n⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // Find admin by email
    console.log(`\n🔍 Finding admin with email: ${email}`);
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      console.log(`❌ Admin with email "${email}" not found in Admin collection`);
      console.log("\n💡 Tip: Make sure the admin account exists first");
      process.exit(1);
    }

    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Access Level: ${admin.accessLevel}`);

    // Check if already exists as SuperAdmin
    const existingSuperAdmin = await SuperAdmin.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingSuperAdmin) {
      console.log(`\n⚠️  This email already exists as SuperAdmin`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log(`   Access Level: ${existingSuperAdmin.accessLevel}`);
      console.log(`\n💡 They can login directly at: http://localhost:5173/superadmin-login`);
      process.exit(0);
    }

    // Create SuperAdmin entry
    console.log(`\n📝 Creating SuperAdmin entry...`);
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
    console.log("✅ SuperAdmin entry created successfully");

    // Display results
    console.log("\n📋 Conversion Summary:");
    console.log("======================");
    console.log(`✅ Admin Name: ${newSuperAdmin.name}`);
    console.log(`✅ Email: ${newSuperAdmin.email}`);
    console.log(`✅ Role: ${newSuperAdmin.role}`);
    console.log(`✅ Access Level: ${newSuperAdmin.accessLevel}%`);
    console.log(`✅ Permissions: ${newSuperAdmin.permissions.length} (all permissions)`);
    console.log(`✅ Status: Active`);

    console.log("\n🎉 Conversion completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log("1. The admin can now login as SuperAdmin");
    console.log("2. Go to: http://localhost:5173/superadmin-login");
    console.log("3. Use the same email and password they used as admin");
    console.log("4. They will have full SuperAdmin access");

    console.log("\n💡 Tips:");
    console.log("- Password has NOT been changed");
    console.log("- Original Admin record remains in Admin collection");
    console.log("- All actions are logged for audit purposes");
    console.log("- They can now access all SuperAdmin features");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("- Verify MongoDB connection string in .env file");
    console.error("- Make sure MongoDB server is running");
    console.error("- Ensure the admin email is correct");
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log("❌ Please provide an email address");
  console.log("\nUsage: node scripts/convertAdminToSuperAdmin.js <email>");
  console.log("Example: node scripts/convertAdminToSuperAdmin.js jsbhiloj@gmail.com");
  process.exit(1);
}

convertAdminToSuperAdmin(email);
