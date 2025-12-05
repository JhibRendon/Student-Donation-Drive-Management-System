/**
 * ============================================
 * ADMIN MANAGEMENT CONTROLLER
 * ============================================
 * 
 * Handles CRUD operations for admins with RBAC
 * Only SuperAdmin can create, edit, and delete admins
 */

import Admin, { ADMIN_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../models/Admin.js";
import bcrypt from "bcryptjs";
import ActivityLog from "../models/ActivityLog.js";
import { sendSuccess, sendError, HTTP_CODES } from "../utils/responseHandler.js";

/**
 * Calculate access level based on permissions
 * @param {Array} permissions - Admin permissions array
 * @param {String} role - Admin role
 * @returns {Number} Access level percentage (0-100)
 */
const calculateAccessLevel = (permissions, role) => {
  if (role === ADMIN_ROLES.SUPER_ADMIN) {
    return 100; // SuperAdmin always has 100% access
  }

  // For regular admins, calculate based on permissions count
  const maxPermissions = Object.values(PERMISSIONS).length;
  const permissionPercentage = (permissions.length / maxPermissions) * 80; // Max 80% for admins
  const baseLevel = 20; // Base level for any admin

  return Math.round(baseLevel + permissionPercentage);
};

/**
 * Get all admins (SuperAdmin only)
 */
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password -resetCode -resetCodeExpire");
    
    // Enrich with access level calculation
    const enrichedAdmins = admins.map((admin) => ({
      ...admin.toObject(),
      accessLevel: calculateAccessLevel(admin.permissions, admin.role),
    }));

    return sendSuccess(res, enrichedAdmins, "Admins fetched successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return sendError(res, "Failed to fetch admins", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select("-password -resetCode -resetCodeExpire");
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    const enrichedAdmin = {
      ...admin.toObject(),
      accessLevel: calculateAccessLevel(admin.permissions, admin.role),
    };

    return sendSuccess(res, enrichedAdmin, "Admin fetched successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error fetching admin:", error);
    return sendError(res, "Failed to fetch admin", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Create a new admin (SuperAdmin only)
 */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Validation
    if (!name || !email || !password) {
      return sendError(res, "Name, email, and password are required", HTTP_CODES.BAD_REQUEST);
    }

    if (!Object.values(ADMIN_ROLES).includes(role)) {
      return sendError(res, `Invalid role. Must be one of: ${Object.values(ADMIN_ROLES).join(", ")}`, HTTP_CODES.BAD_REQUEST);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return sendError(res, "Admin with this email already exists", HTTP_CODES.CONFLICT);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine permissions
    let assignedPermissions;
    if (role === ADMIN_ROLES.SUPER_ADMIN) {
      assignedPermissions = ROLE_PERMISSIONS[ADMIN_ROLES.SUPER_ADMIN];
    } else {
      // Use provided permissions or default for Admin role
      assignedPermissions = permissions || ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];
    }

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
      permissions: assignedPermissions,
      accessLevel: calculateAccessLevel(assignedPermissions, role),
      createdBy: req.admin.id, // SuperAdmin who created this admin
    });

    await newAdmin.save();

    // Log activity
    await ActivityLog.create({
      action: "ADMIN_CREATED",
      description: `Admin '${name}' created with role '${role}'`,
      performedBy: req.admin.id,
      targetType: "Admin",
      targetId: newAdmin._id,
    });

    return sendSuccess(res, {
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      permissions: newAdmin.permissions,
      accessLevel: newAdmin.accessLevel,
    }, "Admin created successfully", HTTP_CODES.CREATED);
  } catch (error) {
    console.error("Error creating admin:", error);
    return sendError(res, "Failed to create admin", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Update admin (DEPRECATED - Use roleManagementController.updateAdminRole instead)
 * 
 * ⚠️ DEPRECATED: This endpoint should no longer be used
 * Edit operations have been moved to /api/admin/manage-roles/admins/:id
 * This function is kept for backward compatibility only
 */
export const updateAdmin = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "This endpoint is deprecated. Use PUT /api/admin/manage-roles/admins/:id instead",
    code: "ENDPOINT_DEPRECATED",
    newEndpoint: "PUT /api/admin/manage-roles/admins/:id",
  });
};

/**
 * Delete admin (SuperAdmin only)
 */
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Can't delete yourself
    if (String(id) === String(req.admin.id)) {
      return sendError(res, "Cannot delete your own account", HTTP_CODES.BAD_REQUEST);
    }

    // Find and delete admin
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    // Log activity
    await ActivityLog.create({
      action: "ADMIN_DELETED",
      description: `Admin '${admin.name}' deleted`,
      performedBy: req.admin.id,
      targetType: "Admin",
      targetId: id,
    });

    return sendSuccess(res, null, "Admin deleted successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error deleting admin:", error);
    return sendError(res, "Failed to delete admin", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Grant permissions to admin (SuperAdmin only)
 */
export const grantPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return sendError(res, "Permissions must be an array", HTTP_CODES.BAD_REQUEST);
    }

    // Validate all permissions
    const validPermissions = permissions.filter((perm) =>
      Object.values(PERMISSIONS).includes(perm)
    );

    const admin = await Admin.findById(id);
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    // Can't downgrade SuperAdmin
    if (admin.role === ADMIN_ROLES.SUPER_ADMIN) {
      return sendError(res, "Cannot modify SuperAdmin permissions", HTTP_CODES.FORBIDDEN);
    }

    admin.permissions = validPermissions;
    admin.accessLevel = calculateAccessLevel(validPermissions, admin.role);
    admin.updatedAt = new Date();

    await admin.save();

    // Log activity
    await ActivityLog.create({
      action: "PERMISSIONS_GRANTED",
      description: `Granted ${validPermissions.length} permissions to '${admin.name}'`,
      performedBy: req.admin.id,
      targetType: "Admin",
      targetId: admin._id,
    });

    return sendSuccess(res, {
      _id: admin._id,
      name: admin.name,
      permissions: admin.permissions,
      accessLevel: admin.accessLevel,
    }, "Permissions granted successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error granting permissions:", error);
    return sendError(res, "Failed to grant permissions", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Revoke permissions from admin (SuperAdmin only)
 */
export const revokePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return sendError(res, "Permissions must be an array", HTTP_CODES.BAD_REQUEST);
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    // Can't downgrade SuperAdmin
    if (admin.role === ADMIN_ROLES.SUPER_ADMIN) {
      return sendError(res, "Cannot modify SuperAdmin permissions", HTTP_CODES.FORBIDDEN);
    }

    // Remove specified permissions
    admin.permissions = admin.permissions.filter(
      (perm) => !permissions.includes(perm)
    );
    admin.accessLevel = calculateAccessLevel(admin.permissions, admin.role);
    admin.updatedAt = new Date();

    await admin.save();

    // Log activity
    await ActivityLog.create({
      action: "PERMISSIONS_REVOKED",
      description: `Revoked ${permissions.length} permissions from '${admin.name}'`,
      performedBy: req.admin.id,
      targetType: "Admin",
      targetId: admin._id,
    });

    return sendSuccess(res, {
      _id: admin._id,
      name: admin.name,
      permissions: admin.permissions,
      accessLevel: admin.accessLevel,
    }, "Permissions revoked successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error revoking permissions:", error);
    return sendError(res, "Failed to revoke permissions", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Get all available permissions
 */
export const getAvailablePermissions = async (req, res) => {
  try {
    return sendSuccess(res, Object.values(PERMISSIONS), "Permissions fetched successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return sendError(res, "Failed to fetch permissions", HTTP_CODES.INTERNAL_ERROR, error);
  }
};
