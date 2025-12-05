import mongoose from "mongoose";

// Define role enums
export const ADMIN_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
};

// Define permission enums for granular control
export const PERMISSIONS = {
  // Campaign permissions
  CREATE_CAMPAIGN: "create_campaign",
  VIEW_CAMPAIGNS: "view_campaigns",
  APPROVE_CAMPAIGN: "approve_campaign",
  REJECT_CAMPAIGN: "reject_campaign",
  DELETE_CAMPAIGN: "delete_campaign",
  EDIT_CAMPAIGN: "edit_campaign",
  
  // Donation permissions
  VIEW_DONATIONS: "view_donations",
  MANAGE_DONATIONS: "manage_donations",
  
  // Admin management permissions
  CREATE_ADMIN: "create_admin",
  VIEW_ADMINS: "view_admins",
  EDIT_ADMIN: "edit_admin",
  DELETE_ADMIN: "delete_admin",
  
  // Donor management permissions
  VIEW_DONORS: "view_donors",
  MANAGE_DONORS: "manage_donors",
  
  // Category permissions
  MANAGE_CATEGORIES: "manage_categories",
  
  // Settings permissions
  VIEW_ACTIVITY_LOGS: "view_activity_logs",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
};

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  [ADMIN_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.CREATE_CAMPAIGN,
    PERMISSIONS.VIEW_DONATIONS,
    PERMISSIONS.VIEW_DONORS,
    PERMISSIONS.VIEW_ACTIVITY_LOGS,
    // Note: SuperAdmin must explicitly grant other permissions like approve/delete
  ],
};

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // Google users won't have a password
  },
  role: {
    type: String,
    enum: Object.values(ADMIN_ROLES),
    default: ADMIN_ROLES.ADMIN,
  },
  // Custom permissions - allows SuperAdmin to grant specific permissions to Admins
  permissions: {
    type: [String],
    default: () => ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN],
  },
  // Access level percentage (0-100)
  accessLevel: {
    type: Number,
    default: 60, // Base level for new admins
    min: 0,
    max: 100,
  },
  // Track who created/assigned this admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },
  profileImage: {
    type: String, // store Google profile picture URL
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
  avatar: {
    type: String,
    default: "",
  },
  // 👇 Add these fields for password reset
  resetCode: {
    type: String,
    default: null,
  },
  resetCodeExpire: {
    type: Date,
    default: null,
  },
  // Status flags
  isActive: {
    type: Boolean,
    default: true,
  },
  // Version field for optimistic concurrency control
  version: {
    type: Number,
    default: 0,
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

// Middleware to update updatedAt before saving
adminSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Admin", adminSchema);
