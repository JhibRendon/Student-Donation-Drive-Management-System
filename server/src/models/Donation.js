// server/models/Donation.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  type: String,
  cashAmount: Number,
  goodsDescription: String,
  goodsPhoto: String,
  gcashReceipt: String,
  donor: {
    name: String,
    email: String,
    contactNumber: String,
    address: String,
  },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" },
  deliveryDate: Date,
  status: { type: String, default: "Pending" }, // Pending, Complete, Verified
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Donation", donationSchema);