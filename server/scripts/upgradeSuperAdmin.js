import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin, { ADMIN_ROLES, PERMISSIONS } from "../src/models/Admin.js";

dotenv.config();

const upgradeSuperAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ MongoDB connected");

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`❌ Admin with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`\n📝 Found admin: ${admin.name} (${admin.email})`);
    console.log(`Current role: ${admin.role}`);

    // Upgrade to SuperAdmin
    admin.role = ADMIN_ROLES.SUPER_ADMIN;
    admin.permissions = Object.values(PERMISSIONS);
    admin.accessLevel = 100;

    await admin.save();

    console.log(`\n✅ Successfully upgraded to SuperAdmin!`);
    console.log(`📋 Details:`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Role: ${admin.role}`);
    console.log(`   - Access Level: ${admin.accessLevel}%`);
    console.log(`   - Permissions: ${admin.permissions.length} (all permissions)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log("❌ Please provide an email address");
  console.log("Usage: node upgradeSuperAdmin.js procode874@gmail.com");
  process.exit(1);
}

upgradeSuperAdmin(email);
