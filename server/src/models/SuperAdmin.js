import mongoose from "mongoose";

const superAdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "SuperAdmin",
    enum: ["SuperAdmin"],
  },
  // SuperAdmin has all permissions by default
  permissions: {
    type: [String],
    default: [
      "create_campaign",
      "view_campaigns",
      "approve_campaign",
      "reject_campaign",
      "delete_campaign",
      "edit_campaign",
      "view_donations",
      "manage_donations",
      "create_admin",
      "view_admins",
      "edit_admin",
      "delete_admin",
      "view_donors",
      "manage_donors",
      "manage_categories",
      "view_activity_logs",
      "manage_system_settings",
    ],
  },
  // Access level is always 100 for SuperAdmin
  accessLevel: {
    type: Number,
    default: 100,
    immutable: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  contactNumber: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  zipCode: {
    type: String,
    default: "",
  },
  department: {
    type: String,
    default: "System Administration",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
superAdminSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("SuperAdmin", superAdminSchema);
