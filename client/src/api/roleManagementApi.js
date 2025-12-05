/**
 * ============================================
 * ROLE MANAGEMENT API WRAPPER
 * ============================================
 * 
 * Frontend API calls for SuperAdmin role management
 * Handles Edit operations with MVCC (Optimistic Concurrency Control)
 * 
 * Separate from RBAC which handles Create/Delete operations
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/admin/manage-roles";

/**
 * Get all admins for role management
 */
export const getAllAdminsForManagement = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/admins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching admins for management:", err);
    throw err;
  }
};

/**
 * Get admin by ID for editing (with version info for MVCC)
 * @param {String} adminId - Admin ID to fetch
 * @returns {Object} Admin data with __v version
 */
export const getAdminForEditing = async (adminId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/admins/${adminId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching admin for editing:", err);
    throw err;
  }
};

/**
 * Update admin role and permissions with MVCC
 * @param {String} adminId - Admin ID to update
 * @param {Object} updateData - { name, email, role, permissions, __v }
 * 
 * Returns 409 if concurrent edit detected (version mismatch)
 */
export const updateAdminRole = async (adminId, updateData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `${API_BASE_URL}/admins/${adminId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    // Check if it's a concurrent edit error (409)
    if (err.response?.status === 409) {
      const conflictError = new Error("Concurrent Edit Detected");
      conflictError.code = "CONCURRENT_EDIT";
      conflictError.currentVersion = err.response.data?.currentVersion;
      conflictError.originalError = err;
      throw conflictError;
    }
    console.error("Error updating admin role:", err);
    throw err;
  }
};

/**
 * Get available roles and permissions
 * Used to populate dropdowns in the UI
 */
export const getAvailableRoleOptions = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/available-options`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching role options:", err);
    throw err;
  }
};

/**
 * Get role change history for a specific admin
 * @param {String} adminId - Admin ID
 * @returns {Object} List of role/permission changes
 */
export const getAdminRoleChangeHistory = async (adminId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${API_BASE_URL}/admins/${adminId}/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching role history:", err);
    throw err;
  }
};

export default {
  getAllAdminsForManagement,
  getAdminForEditing,
  updateAdminRole,
  getAvailableRoleOptions,
  getAdminRoleChangeHistory,
};
