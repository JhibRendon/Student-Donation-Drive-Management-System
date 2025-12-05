/**
 * ============================================
 * ADMIN RBAC API WRAPPER
 * ============================================
 * 
 * Frontend API calls for SuperAdmin RBAC operations
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/admin";

/**
 * Get all admins
 */
export const getAllAdmins = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/rbac/admins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching admins:", err);
    throw err;
  }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (adminId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/rbac/admins/${adminId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching admin:", err);
    throw err;
  }
};

/**
 * Create new admin
 * @param {Object} adminData - { name, email, password, role, permissions }
 */
export const createAdmin = async (adminData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_BASE_URL}/rbac/admins`, adminData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error creating admin:", err);
    throw err;
  }
};

/**
 * Update admin (DEPRECATED)
 * ⚠️ DEPRECATED: Use roleManagementApi.updateAdminRole instead
 * 
 * This function is kept for backward compatibility only.
 * Edit operations have been moved to the dedicated Role Management module
 * with MVCC (Optimistic Concurrency Control) for better concurrent edit handling.
 * 
 * @deprecated Use roleManagementApi.updateAdminRole instead
 */
export const updateAdmin = async (adminId, updateData) => {
  throw new Error(
    "updateAdmin has been deprecated. Use roleManagementApi.updateAdminRole instead. " +
    "This provides better concurrency control and handles concurrent edits properly."
  );
};

/**
 * Delete admin
 * @param {String} adminId - Admin ID to delete
 */
export const deleteAdmin = async (adminId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_BASE_URL}/rbac/admins/${adminId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error deleting admin:", err);
    throw err;
  }
};

/**
 * Grant permissions to admin
 * @param {String} adminId - Admin ID
 * @param {Array} permissions - Array of permission strings
 */
export const grantPermissions = async (adminId, permissions) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE_URL}/rbac/admins/${adminId}/permissions/grant`,
      { permissions },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error granting permissions:", err);
    throw err;
  }
};

/**
 * Revoke permissions from admin
 * @param {String} adminId - Admin ID
 * @param {Array} permissions - Array of permission strings to revoke
 */
export const revokePermissions = async (adminId, permissions) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE_URL}/rbac/admins/${adminId}/permissions/revoke`,
      { permissions },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error revoking permissions:", err);
    throw err;
  }
};

/**
 * Get available permissions and roles
 */
export const getAvailablePermissions = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/rbac/permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching permissions:", err);
    throw err;
  }
};

// ============================================
// NEW ADMIN MANAGEMENT API FUNCTIONS
// ============================================

/**
 * Get all admins with their roles and permissions
 */
export const getAllAdminsWithRoles = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/all-admins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching all admins:", err);
    throw err;
  }
};

/**
 * Update admin role (Admin or SuperAdmin)
 * @param {String} adminId - Admin ID
 * @param {String} role - New role ("Admin" or "SuperAdmin")
 * @param {Array} permissions - Array of permissions (optional for SuperAdmin)
 * @param {Number} accessLevel - Access level percentage 0-100 (optional for SuperAdmin)
 */
export const updateAdminRole = async (adminId, role, permissions, accessLevel) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `${API_BASE_URL}/update-admin-role/${adminId}`,
      { role, permissions, accessLevel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error updating admin role:", err);
    throw err;
  }
};

/**
 * Update admin permissions and access level
 * @param {String} adminId - Admin ID
 * @param {Array} permissions - Array of permission strings
 * @param {Number} accessLevel - Access level percentage 0-100
 */
export const updateAdminPermissions = async (adminId, permissions, accessLevel) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `${API_BASE_URL}/update-admin-permissions/${adminId}`,
      { permissions, accessLevel },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error updating admin permissions:", err);
    throw err;
  }
};

/**
 * Get available permissions for selection
 */
export const getAvailablePermissionsForSelection = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/available-permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching available permissions:", err);
    throw err;
  }
};

/**
 * Deactivate admin account
 * @param {String} adminId - Admin ID to deactivate
 */
export const deactivateAdmin = async (adminId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `${API_BASE_URL}/deactivate-admin/${adminId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error deactivating admin:", err);
    throw err;
  }
};

/**
 * Activate admin account
 * @param {String} adminId - Admin ID to activate
 */
export const activateAdmin = async (adminId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `${API_BASE_URL}/activate-admin/${adminId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error activating admin:", err);
    throw err;
  }
};
