#!/usr/bin/env node

/**
 * ============================================
 * SUPERADMIN INITIALIZATION SCRIPT
 * ============================================
 * 
 * This script converts an existing admin to SuperAdmin with full permissions.
 * Usage: node scripts/initSuperAdmin.js <email>
 * 
 * Example:
 * node scripts/initSuperAdmin.js admin@example.com
 */

import mongoose from "mongoose";
import Admin, { ADMIN_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../src/models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/donation_drive";

async function initSuperAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error(
      "❌ Error: Email is required.\nUsage: node scripts/initSuperAdmin.js <email>"
    );
    process.exit(1);
  }

  try {
    console.log("\n🔧 SuperAdmin Initialization Script");
    console.log("=====================================");
    console.log(`📧 Target Email: ${email}`);
    console.log(`🗄️  MongoDB URL: ${MONGODB_URL}`);

    // Connect to MongoDB
    console.log("\n⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // Find admin
    console.log("\n🔍 Looking for admin...");
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.error(`❌ Admin with email '${email}' not found.`);
      console.log("\n📋 Available admins:");
      const allAdmins = await Admin.find().select("name email role");
      if (allAdmins.length === 0) {
        console.log("   No admins found in database.");
      } else {
        allAdmins.forEach((a) => {
          console.log(`   - ${a.name} (${a.email}) - Role: ${a.role}`);
        });
      }
      process.exit(1);
    }

    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    console.log(`   Current role: ${admin.role}`);
    console.log(`   Current permissions: ${admin.permissions?.length || 0}`);

    // Update to SuperAdmin
    console.log("\n🔄 Updating to SuperAdmin...");
    admin.role = ADMIN_ROLES.SUPER_ADMIN;
    admin.permissions = ROLE_PERMISSIONS[ADMIN_ROLES.SUPER_ADMIN];
    admin.accessLevel = 100;
    admin.updatedAt = new Date();

    await admin.save();

    console.log(`✅ Successfully promoted to SuperAdmin`);
    console.log(`\n📊 Updated Profile:`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Permissions: ${admin.permissions.length} (all permissions granted)`);
    console.log(`   Access Level: ${admin.accessLevel}%`);

    console.log("\n✨ SuperAdmin initialization complete!");
    console.log(
      "\n💡 Tip: You can now use this admin account to manage other admins and permissions."
    );

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during initialization:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error(
        "   Make sure MongoDB is running and the MONGODB_URL is correct."
      );
    }
    process.exit(1);
  }
}

initSuperAdmin();
