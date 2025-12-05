import Campaign from "../models/Campaign.js"; // your Mongoose model

// Create a new campaign
export const createCampaign = async (req, res) => {
  try {
    const campaignData = req.body;

    console.log('📝 Campaign creation request received:');
    console.log('- Donation Type:', campaignData.donationType);
    console.log('- Campaign data keys:', Object.keys(campaignData));
    console.log('- Full campaign data:', JSON.stringify(campaignData, null, 2));

    // Validate required fields based on donation type
    if (!campaignData.title) {
      console.warn('❌ Validation failed: title is required');
      return res.status(400).json({ success: false, message: "Campaign title is required" });
    }
    if (!campaignData.shortDescription) {
      console.warn('❌ Validation failed: shortDescription is required');
      return res.status(400).json({ success: false, message: "Short description is required" });
    }
    if (!campaignData.fullDescription) {
      console.warn('❌ Validation failed: fullDescription is required');
      return res.status(400).json({ success: false, message: "Full description is required" });
    }
    if (!campaignData.donationType) {
      console.warn('❌ Validation failed: donationType is required');
      return res.status(400).json({ success: false, message: "Donation type is required" });
    }
    if (!campaignData.campaignPhoto) {
      console.warn('❌ Validation failed: campaignPhoto is required');
      return res.status(400).json({ success: false, message: "Campaign photo is required" });
    }
    if (!campaignData.beneficiaryName) {
      console.warn('❌ Validation failed: beneficiaryName is required');
      return res.status(400).json({ success: false, message: "Beneficiary name is required" });
    }
    if (!campaignData.email) {
      console.warn('❌ Validation failed: email is required');
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!campaignData.contactNumber) {
      console.warn('❌ Validation failed: contactNumber is required');
      return res.status(400).json({ success: false, message: "Contact number is required" });
    }

    console.log('✓ Basic validation passed');

    // Validate donation type specific fields
    if (campaignData.donationType === "Cash") {
      console.log('Validating Cash donation fields...');
      if (!campaignData.goalAmount) {
        console.warn('❌ Cash validation failed: goalAmount is required');
        return res.status(400).json({ success: false, message: "Goal amount is required for Cash donations" });
      }
      if (!campaignData.gcashName) {
        console.warn('❌ Cash validation failed: gcashName is required');
        return res.status(400).json({ success: false, message: "GCash name is required for Cash donations" });
      }
      if (!campaignData.gcashNumber) {
        console.warn('❌ Cash validation failed: gcashNumber is required');
        return res.status(400).json({ success: false, message: "GCash number is required for Cash donations" });
      }
      if (!campaignData.gcashQr) {
        console.warn('❌ Cash validation failed: gcashQr is required');
        return res.status(400).json({ success: false, message: "GCash QR code is required for Cash donations" });
      }
      console.log('✓ Cash donation validation passed');
    }
    
    if (campaignData.donationType === "In-Kind") {
      console.log('Validating In-Kind donation fields...');
      console.log('- acceptedGoods:', campaignData.acceptedGoods);
      console.log('- goodsPhoto:', campaignData.goodsPhoto);
      if (!campaignData.acceptedGoods) {
        console.warn('❌ In-Kind validation failed: acceptedGoods is required');
        return res.status(400).json({ success: false, message: "Accepted goods description is required for In-Kind donations" });
      }
      if (!campaignData.goodsPhoto) {
        console.warn('❌ In-Kind validation failed: goodsPhoto is required');
        return res.status(400).json({ success: false, message: "Goods photo is required for In-Kind donations" });
      }
      console.log('✓ In-Kind donation validation passed');
    }

    if (campaignData.donationType === "Services") {
      console.log('Validating Services donation fields...');
      if (!campaignData.acceptedGoods) {
        console.warn('❌ Services validation failed: acceptedGoods is required');
        return res.status(400).json({ success: false, message: "Services description is required for Services donations" });
      }
      console.log('✓ Services donation validation passed');
    }

    console.log('✓ All validations passed');

    // Convert number fields
    if (campaignData.goalAmount) campaignData.goalAmount = Number(campaignData.goalAmount);

    // Explicitly set status to Pending (requires admin approval)
    campaignData.status = "Pending";

    const newCampaign = await Campaign.create(campaignData);
    
    console.log('✅ Campaign created with ID:', newCampaign._id);
    
    res.status(201).json({ success: true, campaign: newCampaign });
  } catch (error) {
    console.error("❌ Error creating campaign:", error.message);
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Failed to create campaign" });
  }
};

// Get all campaigns (for Explore page)
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find(); // fetch all campaigns
    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// Optionally: Get campaign by ID
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.status(200).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
};
