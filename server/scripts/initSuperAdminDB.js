#!/usr/bin/env node

/**
 * ============================================
 * SUPERADMIN DATABASE INITIALIZATION SCRIPT
 * ============================================
 * 
 * This script creates the first SuperAdmin account in the separate SuperAdmin collection.
 * Usage: node scripts/initSuperAdminDB.js <name> <email> <password>
 * 
 * Example:
 * node scripts/initSuperAdminDB.js "System Admin" admin@example.com password123
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import SuperAdmin from "../src/models/SuperAdmin.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/donation_drive";

async function initSuperAdminDB() {
  const name = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];

  if (!name || !email || !password) {
    console.error(
      "❌ Error: All fields are required.\nUsage: node scripts/initSuperAdminDB.js <name> <email> <password>"
    );
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Error: Password must be at least 6 characters.");
    process.exit(1);
  }

  try {
    console.log("\n🔧 SuperAdmin Database Initialization Script");
    console.log("==============================================");
    console.log(`👤 Name: ${name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🗄️  MongoDB URL: ${MONGODB_URL}`);

    // Connect to MongoDB
    console.log("\n⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // Check if SuperAdmin already exists
    console.log("\n🔍 Checking if SuperAdmin already exists...");
    const existingSuperAdmin = await SuperAdmin.findOne({
      email: email.toLowerCase(),
    });

    if (existingSuperAdmin) {
      console.error(`❌ SuperAdmin with email '${email}' already exists.`);
      console.log("\n📋 Existing SuperAdmins:");
      const superAdmins = await SuperAdmin.find().select(
        "name email createdAt"
      );
      superAdmins.forEach((sa) => {
        console.log(`   • ${sa.name} (${sa.email}) - Created: ${sa.createdAt}`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    // Hash password
    console.log("\n🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create SuperAdmin
    console.log("\n✨ Creating SuperAdmin account...");
    const superAdmin = new SuperAdmin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "SuperAdmin",
      isActive: true,
      department: "System Administration",
    });

    await superAdmin.save();

    console.log("✅ SuperAdmin created successfully!");
    console.log("\n📋 SuperAdmin Details:");
    console.log(`   • ID: ${superAdmin._id}`);
    console.log(`   • Name: ${superAdmin.name}`);
    console.log(`   • Email: ${superAdmin.email}`);
    console.log(`   • Role: ${superAdmin.role}`);
    console.log(`   • Status: ${superAdmin.isActive ? "Active" : "Inactive"}`);
    console.log(`   • Created: ${superAdmin.createdAt}`);
    console.log("\n🔑 Permissions: All system permissions granted");

    // List all SuperAdmins
    console.log("\n📊 All SuperAdmins in Database:");
    const allSuperAdmins = await SuperAdmin.find().select(
      "name email isActive createdAt"
    );
    allSuperAdmins.forEach((sa, index) => {
      const status = sa.isActive ? "✅ Active" : "❌ Inactive";
      console.log(`   ${index + 1}. ${sa.name} (${sa.email}) - ${status}`);
    });

    console.log("\n✅ Initialization complete!");
    console.log(
      "\n💡 Next Steps:"
    );
    console.log("   1. Use the SuperAdmin login endpoint: POST /api/superadmin/login");
    console.log(`   2. Email: ${email}`);
    console.log("   3. Password: [the password you provided]");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

initSuperAdminDB();
