/**
 * ============================================
 * SUPERADMIN API WRAPPER
 * ============================================
 * 
 * Centralized API calls for SuperAdmin authentication and management
 * Base URL: http://localhost:5000/api/superadmin
 */

const API_BASE_URL = "http://localhost:5000/api/superadmin";

/**
 * SuperAdmin Login
 * @param {string} email - SuperAdmin email
 * @param {string} password - SuperAdmin password
 * @returns {Promise} - Response with token and admin data
 */
export const superAdminLogin = async (email, password) => {
  try {
    console.log("🔍 Attempting to login to:", API_BASE_URL + "/login");
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("📊 Response status:", response.status);
    const data = await response.json();
    console.log("📦 Response data:", data);
    return data;
  } catch (error) {
    console.error("❌ SuperAdmin login error:", error);
    console.error("   Error message:", error.message);
    console.error("   Error type:", error.constructor.name);
    return { 
      success: false, 
      message: `Network error: ${error.message}. Make sure the backend server is running on port 5000.` 
    };
  }
};

/**
 * Register New SuperAdmin (Protected - Only existing SuperAdmins)
 * @param {string} name - SuperAdmin name
 * @param {string} email - SuperAdmin email
 * @param {string} password - SuperAdmin password
 * @param {string} token - JWT token of requesting SuperAdmin
 * @returns {Promise} - Response with new SuperAdmin data
 */
export const registerSuperAdmin = async (name, email, password, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Register SuperAdmin error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Get SuperAdmin Profile
 * @param {string} token - JWT token
 * @returns {Promise} - SuperAdmin profile data
 */
export const getSuperAdminProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Update SuperAdmin Profile
 * @param {object} profileData - Data to update (name, contactNumber, address, city, zipCode, profileImage)
 * @param {string} token - JWT token
 * @returns {Promise} - Updated profile data
 */
export const updateSuperAdminProfile = async (profileData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Change SuperAdmin Password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirm new password
 * @param {string} token - JWT token
 * @returns {Promise} - Success/failure response
 */
export const changeSuperAdminPassword = async (
  currentPassword,
  newPassword,
  confirmPassword,
  token
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Get All SuperAdmins (Protected)
 * @param {string} token - JWT token
 * @returns {Promise} - List of all SuperAdmins
 */
export const getAllSuperAdmins = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get all SuperAdmins error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Deactivate SuperAdmin Account
 * @param {string} superAdminId - SuperAdmin ID to deactivate
 * @param {string} token - JWT token
 * @returns {Promise} - Success/failure response
 */
export const deactivateSuperAdmin = async (superAdminId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deactivate/${superAdminId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Deactivate SuperAdmin error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Activate SuperAdmin Account
 * @param {string} superAdminId - SuperAdmin ID to activate
 * @param {string} token - JWT token
 * @returns {Promise} - Success/failure response
 */
export const activateSuperAdmin = async (superAdminId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activate/${superAdminId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Activate SuperAdmin error:", error);
    return { success: false, message: "Network error" };
  }
};

/**
 * Convert Admin to SuperAdmin
 * @param {string} email - Email of admin to convert
 * @param {string} token - JWT token of requesting SuperAdmin
 * @returns {Promise} - Response with new SuperAdmin data
 */
export const convertAdminToSuperAdmin = async (email, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/convert-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Convert admin to SuperAdmin error:", error);
    return { success: false, message: "Network error" };
  }
};

