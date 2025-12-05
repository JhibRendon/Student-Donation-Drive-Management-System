/**
 * Clean up duplicate SuperAdmin accounts and create proper one
 * This ensures database integrity
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import Admin, { ADMIN_ROLES, PERMISSIONS } from '../src/models/Admin.js';

dotenv.config();

async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Find all SuperAdmin accounts
    const superAdmins = await Admin.find({ role: ADMIN_ROLES.SUPER_ADMIN });
    
    if (superAdmins.length > 1) {
      console.log(`\n⚠️  Found ${superAdmins.length} SuperAdmin accounts!`);
      console.log('Removing duplicates...\n');

      // Keep the first one, delete others
      const superAdminToKeep = superAdmins[0];
      const idsToDelete = superAdmins.slice(1).map(a => a._id);

      // Delete duplicates
      await Admin.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`✅ Deleted ${idsToDelete.length} duplicate SuperAdmin accounts\n`);

      console.log('Remaining SuperAdmin:');
      console.log(`   ID: ${superAdminToKeep._id}`);
      console.log(`   Name: ${superAdminToKeep.name}`);
      console.log(`   Email: ${superAdminToKeep.email}`);
      console.log(`   Role: ${superAdminToKeep.role}`);
      console.log(`   Permissions: ${superAdminToKeep.permissions.length}`);
    } else if (superAdmins.length === 1) {
      console.log('✅ Only one SuperAdmin account exists');
    } else {
      console.log('⚠️  No SuperAdmin accounts found!');
      console.log('Please run: node scripts/initSuperAdminDB.js <name> <email> <password>\n');
      console.log('This script does NOT auto-create SuperAdmins anymore for security reasons.');
    }

    // Also check for any Admin accounts with role field issues
    const invalidAdmins = await Admin.find({ 
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' }
      ]
    });

    if (invalidAdmins.length > 0) {
      console.log(`\n⚠️  Found ${invalidAdmins.length} admin accounts with invalid role`);
      console.log('Fixing...');
      
      await Admin.updateMany(
        { $or: [{ role: { $exists: false } }, { role: null }, { role: '' }] },
        { role: ADMIN_ROLES.ADMIN }
      );
      
      console.log(`✅ Fixed ${invalidAdmins.length} admin accounts`);
    }

    console.log('\n✅ Database cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDatabase();
