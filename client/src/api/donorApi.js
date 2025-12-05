// client/src/api/donorApi.js
import axios from "axios";
import { getDonorEmail } from "../utils/storageHelper.js";

const API_BASE_URL = "http://localhost:5000/api/donor"; // backend base URL

// Helper function to get the correct token for multi-user support
const getToken = () => {
  // Try to get from multi-user key first
  const currentDonorId = localStorage.getItem("currentDonorId");
  if (currentDonorId) {
    const multiUserToken = localStorage.getItem(`token_${currentDonorId}`);
    if (multiUserToken) return multiUserToken;
  }
  
  // Fallback to old token key for backward compatibility
  return localStorage.getItem("token");
};

// ======================
// CAMPAIGNS / EXPLORE
// ====================== // Get all campaigns (Explore page) - excludes campaigns the donor has already donated to
export const getAllCampaigns = async () => {
  try {
    const token = getToken();
    // Get donor email using the storage helper (handles multi-user support)
    const donorEmail = getDonorEmail();
    
    const params = donorEmail ? { donorEmail } : {};
    
    const response = await axios.get(`${API_BASE_URL}/explore`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // backend returns array of campaigns
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    throw err;
  }
};

// Get a single donation drive by ID
export const getDonationDriveById = async (driveId) => {
  try {
    if (!driveId) throw new Error("Drive ID is required");

    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/campaigns/${driveId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching donation drive:", err);
    throw err;
  }
};

// ======================
// DONATIONS
// ======================

// Submit a donation
export const submitDonation = async (donationData) => {
  try {
    if (!donationData || !donationData.driveId) {
      throw new Error("Donation data and driveId are required");
    }

    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/donations`, donationData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (err) {
    console.error("Error submitting donation:", err);
    throw err;
  }
};

// ======================
// DASHBOARD (Optional)
// ======================

// Get donor dashboard stats (if backend supports it)
export const getDashboardStats = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    throw err;
  }
};

// ======================
// CREATE CAMPAIGN (Optional for donors)
// ======================

export const createCampaign = async (campaignData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/create`, campaignData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error creating campaign:", err);
    throw err;
  }
};
// donorApi.js
export const getAllDonations = async (donorEmail) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/donations/${donorEmail}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching donations:", err);
    throw err;
  }
};

