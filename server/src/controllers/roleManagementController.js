/**
 * ============================================
 * ROLE MANAGEMENT CONTROLLER
 * ============================================
 * 
 * Handles role editing operations with MVCC (Optimistic Concurrency Control)
 * Separate from RBAC which handles Create/Delete operations
 * This controller manages Edit operations with version tracking
 */

import Admin, { ADMIN_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../models/Admin.js";
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
 * Get admin for editing with version tracking
 * Prepares admin data for editing UI
 * GET /api/admin/manage-roles/admins/:id
 */
export const getAdminForEditing = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select("-password -resetCode -resetCodeExpire");
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    // Return admin with version info for MVCC
    const enrichedAdmin = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      accessLevel: calculateAccessLevel(admin.permissions, admin.role),
      __v: admin.__v, // Version for optimistic locking
      updatedAt: admin.updatedAt,
      createdAt: admin.createdAt,
      isActive: admin.isActive,
    };

    return sendSuccess(res, enrichedAdmin, "Admin fetched successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error fetching admin for editing:", error);
    return sendError(res, "Failed to fetch admin", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Update admin role with MVCC (Optimistic Concurrency Control)
 * PUT /api/admin/manage-roles/admins/:id
 * 
 * Body: {
 *   name: String,
 *   email: String,
 *   role: String,
 *   permissions: Array,
 *   __v: Number (for optimistic locking)
 * }
 * 
 * Returns 409 if version mismatch (concurrent edit detected)
 */
export const updateAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, permissions, __v: clientVersion } = req.body;

    // Validate client version (MVCC)
    if (clientVersion === undefined) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Version information (__v) is required for safe editing",
        code: "MISSING_VERSION",
      });
    }

    // Find admin
    const admin = await Admin.findById(id);
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    // Can't edit own role/permissions while editing
    if (id === req.admin.id.toString() && role) {
      return sendError(res, "Cannot change your own role", HTTP_CODES.BAD_REQUEST);
    }

    // ============================================
    // MVCC - VERSION CHECK (Optimistic Locking)
    // ============================================
    // Check if server version matches client version
    if (admin.__v !== clientVersion) {
      // Version mismatch - concurrent edit detected
      console.warn(`⚠️ MVCC CONFLICT: Admin ${id}`);
      console.warn(`   Server version: ${admin.__v}, Client version: ${clientVersion}`);

      // Return conflict with latest data
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        message: "This admin was edited by another user. Please refresh and try again.",
        code: "CONCURRENT_EDIT",
        currentVersion: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          accessLevel: calculateAccessLevel(admin.permissions, admin.role),
          __v: admin.__v,
          updatedAt: admin.updatedAt,
        },
      });
    }

    // ============================================
    // SAFE TO UPDATE
    // ============================================

    // Update fields with validation
    if (name && name.trim()) {
      admin.name = name.trim();
    }

    if (email && email !== admin.email) {
      const emailExists = await Admin.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return sendError(res, "Email already in use", HTTP_CODES.CONFLICT);
      }
      admin.email = email.toLowerCase();
    }

    // Update role with validation
    if (role && Object.values(ADMIN_ROLES).includes(role)) {
      admin.role = role;
    }

    // Update permissions with validation
    if (permissions && Array.isArray(permissions)) {
      const validPermissions = permissions.filter((perm) =>
        Object.values(PERMISSIONS).includes(perm)
      );
      admin.permissions = validPermissions;
    }

    // Recalculate access level
    admin.accessLevel = calculateAccessLevel(admin.permissions, admin.role);
    admin.updatedAt = new Date();

    // Save with automatic __v increment
    await admin.save();

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.admin.id.toString(),
      userName: req.admin.name || "SuperAdmin",
      action: "Admin Role Updated",
      details: `Updated admin ${admin.name} (${admin.email}) - Role: ${admin.role}, Permissions: ${admin.permissions.length}`,
      resourceType: "admin",
      resourceId: admin._id.toString(),
    });

    return sendSuccess(res, {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      accessLevel: admin.accessLevel,
      __v: admin.__v, // Return new version
      updatedAt: admin.updatedAt,
    }, "Admin role updated successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error updating admin role:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    return sendError(res, "Failed to update admin", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Get list of all admins (for role management)
 * GET /api/admin/manage-roles/admins
 */
export const getAllAdminsForManagement = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password -resetCode -resetCodeExpire")
      .sort({ createdAt: -1 });

    const enrichedAdmins = admins.map((admin) => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      accessLevel: calculateAccessLevel(admin.permissions, admin.role),
      __v: admin.__v,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }));

    return res.status(HTTP_CODES.OK).json({
      success: true,
      count: enrichedAdmins.length,
      data: enrichedAdmins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return sendError(res, "Failed to fetch admins", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Get available roles and permissions
 * GET /api/admin/manage-roles/available-options
 */
export const getAvailableRoleOptions = async (req, res) => {
  try {
    return sendSuccess(res, {
      roles: Object.values(ADMIN_ROLES),
      permissions: Object.values(PERMISSIONS),
      rolePermissions: ROLE_PERMISSIONS,
    }, "Role options fetched successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error fetching available options:", error);
    return sendError(res, "Failed to fetch options", HTTP_CODES.INTERNAL_ERROR, error);
  }
};

/**
 * Get admin role change history
 * GET /api/admin/manage-roles/admins/:id/history
 */
export const getAdminRoleChangeHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return sendError(res, "Admin not found", HTTP_CODES.NOT_FOUND);
    }

    // Get role-related activity logs
    const activityLogs = await ActivityLog.find({
      resourceId: id,
      action: { $in: ["Admin Role Updated", "Admin Updated"] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return sendSuccess(res, {
      adminId: id,
      adminName: admin.name,
      history: activityLogs,
    }, "History fetched successfully", HTTP_CODES.OK);
  } catch (error) {
    console.error("Error fetching role history:", error);
    return sendError(res, "Failed to fetch history", HTTP_CODES.INTERNAL_ERROR, error);
  }
};
