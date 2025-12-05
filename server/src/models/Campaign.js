import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    // Campaign Information
    title: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 120 },
    fullDescription: { type: String, required: true },
    goalAmount: { type: Number }, // Only required for Cash donations (validated in controller)
    category: { type: String, default: "Community" },
    donationType: { type: String, enum: ["Cash", "In-Kind", "Services"], default: "Cash" },
    isHighPriority: { type: Boolean, default: false },
    campaignPhoto: { type: String }, // URL or base64

    // Payment Methods
    gcashName: String,
    gcashNumber: String,
    gcashQr: String, // URL for GCash QR code
    bankName: String,
    bankNumber: String,
    paypalLink: String,

    // Goods/Services Information
    acceptedGoods: String,
    goodsPhoto: String, // URL for goods photo

    // Contact Information
    beneficiaryName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },

    // Campaign Tracking
    currentAmount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ["Pending", "Approved", "Rejected", "Completed"], 
      default: "Pending" 
    },
    donors: { type: Number, default: 0 },
    adminRemarks: String,
    rejectionReason: String,
    // Version field for optimistic concurrency control
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
