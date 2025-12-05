/**
 * ============================================
 * ROLE MANAGEMENT ROUTE
 * ============================================
 * 
 * Endpoints for managing admin roles and permissions
 * Handles Edit operations with MVCC (Optimistic Concurrency Control)
 * 
 * Separation of concerns:
 * - RBAC routes: Create & Delete admins
 * - This route: Edit admin roles & permissions
 * 
 * All endpoints protected with SuperAdmin-only middleware
 */

import express from "express";
import authMiddleware from "../middleware/auth.js";
import { onlySuperAdmin } from "../middleware/authorize.js";
import { concurrencyControl } from "../middleware/concurrencyControl.js";
import * as roleManagementController from "../controllers/roleManagementController.js";

const router = express.Router();

/**
 * Get all admins for role management
 * GET /api/admin/manage-roles/admins
 * Protected: SuperAdmin only
 */
router.get(
  "/admins",
  authMiddleware,
  onlySuperAdmin,
  roleManagementController.getAllAdminsForManagement
);

/**
 * Get admin by ID for editing (with version info)
 * GET /api/admin/manage-roles/admins/:id
 * Protected: SuperAdmin only
 */
router.get(
  "/admins/:id",
  authMiddleware,
  onlySuperAdmin,
  roleManagementController.getAdminForEditing
);

/**
 * Update admin role and permissions
 * PUT /api/admin/manage-roles/admins/:id
 * Protected: SuperAdmin only
 * Body: { name, email, role, permissions, __v }
 * 
 * Returns 409 (Conflict) if concurrent edit detected
 */
router.put(
  "/admins/:id",
  authMiddleware,
  onlySuperAdmin,
  concurrencyControl,
  roleManagementController.updateAdminRole
);

/**
 * Get available roles and permissions for UI
 * GET /api/admin/manage-roles/available-options
 * Protected: SuperAdmin only
 */
router.get(
  "/available-options",
  authMiddleware,
  onlySuperAdmin,
  roleManagementController.getAvailableRoleOptions
);

/**
 * Get role change history for specific admin
 * GET /api/admin/manage-roles/admins/:id/history
 * Protected: SuperAdmin only
 */
router.get(
  "/admins/:id/history",
  authMiddleware,
  onlySuperAdmin,
  roleManagementController.getAdminRoleChangeHistory
);

export default router;
