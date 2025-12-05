// API service for campaign operations
const API_URL = "http://localhost:5000/api/donor";

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign form data
 * @returns {Promise} Response from server
 */
export const createCampaign = async (campaignData) => {
  try {
    console.log('📤 Sending campaign data to backend:', {
      hasGcashQr: !!campaignData.gcashQr,
      gcashQrLength: campaignData.gcashQr ? campaignData.gcashQr.length : 0,
      gcashName: campaignData.gcashName,
      donationType: campaignData.donationType,
      acceptedGoods: campaignData.acceptedGoods,
      goodsPhoto: !!campaignData.goodsPhoto,
    });
    
    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(campaignData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Backend error response:', responseData);
      console.error('❌ Full response data:', JSON.stringify(responseData, null, 2));
      const errorMessage = responseData.message || responseData.error || "Failed to create campaign";
      console.error('❌ Error message being thrown:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Campaign created successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error("❌ Error creating campaign:", error);
    throw error;
  }
};

/**
 * Get all approved campaigns for explore page
 * @returns {Promise} Array of campaigns
 */
export const getApprovedCampaigns = async () => {
  try {
    const response = await fetch(`${API_URL}/explore`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If server is down or returns error
      if (response.status === 0 || !response.ok) {
        throw new Error('Backend server is not running. Please start the server on port 5000.');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    // Return empty array instead of throwing to prevent white page
    console.warn('Could not fetch campaigns. Check if backend is running on port 5000');
    return [];
  }
};

/**
 * Get single campaign details
 * @param {String} campaignId - Campaign ID
 * @returns {Promise} Campaign details
 */
export const getCampaignDetails = async (campaignId) => {
  try {
    const response = await fetch(`${API_URL}/${campaignId}`);

    if (!response.ok) {
      throw new Error("Campaign not found");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    throw error;
  }
};

// ===== ADMIN FUNCTIONS =====

/**
 * Get all pending campaigns (admin only)
 * @returns {Promise} Array of pending campaigns
 */
export const getPendingCampaigns = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/pending`);

    if (!response.ok) {
      throw new Error("Failed to fetch pending campaigns");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching pending campaigns:", error);
    throw error;
  }
};

/**
 * Get all campaigns (admin only)
 * @returns {Promise} Array of all campaigns
 */
export const getAllCampaigns = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/all`);

    if (!response.ok) {
      throw new Error("Failed to fetch campaigns");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
};

/**
 * Approve a campaign (admin only)
 * @param {String} campaignId - Campaign ID
 * @param {String} adminRemarks - Optional remarks
 * @returns {Promise} Updated campaign
 */
export const approveCampaign = async (campaignId, adminRemarks = "") => {
  try {
    const response = await fetch(`${API_URL}/${campaignId}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminRemarks }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to approve campaign");
    }

    return await response.json();
  } catch (error) {
    console.error("Error approving campaign:", error);
    throw error;
  }
};

/**
 * Reject a campaign (admin only)
 * @param {String} campaignId - Campaign ID
 * @param {String} rejectionReason - Reason for rejection
 * @returns {Promise} Updated campaign
 */
export const rejectCampaign = async (campaignId, rejectionReason) => {
  try {
    if (!rejectionReason) {
      throw new Error("Rejection reason is required");
    }

    const response = await fetch(`${API_URL}/${campaignId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejectionReason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reject campaign");
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting campaign:", error);
    throw error;
  }
};
