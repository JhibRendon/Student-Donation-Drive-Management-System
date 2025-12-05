import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ["admin", "donor"],
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g., "Campaign Created", "Donation Submitted", "Campaign Approved"
  },
  details: {
    type: String,
    default: "",
  },
  resourceType: {
    type: String,
    enum: ["campaign", "donation", "donor", "category", "system"],
    default: "system",
  },
  resourceId: {
    type: String,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ActivityLog", activityLogSchema);

