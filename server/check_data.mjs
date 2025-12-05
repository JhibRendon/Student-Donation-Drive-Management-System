import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './src/models/Admin.js';
import Donor from './src/models/Donor.js';
import Campaign from './src/models/Campaign.js';
import Donation from './src/models/Donation.js';

dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('\ní³Š DATABASE INVENTORY\n');
    
    // Check Admins/SuperAdmins
    const admins = await Admin.find().select('name email role isActive');
    console.log('í±¤ ADMINS:', admins.length);
    admins.forEach(a => console.log(`   - ${a.name} (${a.email}) - Role: ${a.role}`));
    
    // Check Donors
    const donors = await Donor.find().select('name email isVerified');
    console.log('\ní²° DONORS:', donors.length);
    donors.forEach(d => console.log(`   - ${d.name} (${d.email})`));
    
    // Check Campaigns
    const campaigns = await Campaign.find().select('title goal status paymentMethods');
    console.log('\ní¾¯ CAMPAIGNS:', campaigns.length);
    campaigns.forEach(c => console.log(`   - ${c.title} - Goal: $${c.goal} - Status: ${c.status}`));
    
    // Check Donations
    const donations = await Donation.find().select('amount type donor campaign');
    console.log('\ní¾ DONATIONS:', donations.length);
    if (donations.length > 0) {
      donations.forEach(d => console.log(`   - $${d.amount} (${d.type})`));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkData();
