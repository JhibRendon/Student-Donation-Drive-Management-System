const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('./src/models/Admin');
const Donor = require('./src/models/Donor');
const Campaign = require('./src/models/Campaign');
const Donation = require('./src/models/Donation');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
    console.log('\nï¿½ï¿½ CAMPAIGNS:', campaigns.length);
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
