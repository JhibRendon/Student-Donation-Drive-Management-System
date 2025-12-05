// routes/campaignRoutes.js
import express from "express";
import Campaign from "../models/Campaign.js";
import authMiddleware from "../middleware/auth.js";
import { hasPermission } from "../middleware/authorize.js";
import { PERMISSIONS } from "../models/Admin.js";
import ActivityLog from "../models/ActivityLog.js";
import { createCampaign } from "../controllers/campaignController.js";

const router = express.Router();

// ===== DONOR ROUTES =====

// GET all approved campaigns for explore page
router.get("/explore", async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "Approved" })
      .sort({ createdAt: -1 })
      .select("-adminRemarks -rejectionReason");
    res.status(200).json(campaigns);
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// GET single campaign details
router.get("/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    // Only show rejection reason to admin (if needed in future)
    res.status(200).json(campaign);
  } catch (err) {
    console.error("Error fetching campaign:", err);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// ===== PUBLIC ROUTES =====

// POST create new campaign (no authentication required initially)
router.post("/create", createCampaign);

// ===== ADMIN ROUTES =====

// GET all campaigns (admin view - all statuses)
router.get("/admin/all", authMiddleware, hasPermission(PERMISSIONS.VIEW_CAMPAIGNS), async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// GET pending campaigns only
router.get("/admin/pending", authMiddleware, hasPermission(PERMISSIONS.VIEW_CAMPAIGNS), async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "Pending" }).sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (err) {
    console.error("Error fetching pending campaigns:", err);
    res.status(500).json({ error: "Failed to fetch pending campaigns" });
  }
});

// PATCH approve campaign (admin only)
router.patch("/:id/approve", authMiddleware, hasPermission(PERMISSIONS.APPROVE_CAMPAIGN), async (req, res) => {
  try {
    const { adminRemarks } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        status: "Approved",
        adminRemarks: adminRemarks || "",
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.userId,
      userName: req.userName || "Admin",
      action: "Campaign Approved",
      details: `Approved campaign: ${campaign.title}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    res.status(200).json({
      message: "Campaign approved successfully",
      campaign,
    });
  } catch (err) {
    console.error("Error approving campaign:", err);
    res.status(500).json({ error: "Failed to approve campaign" });
  }
});

// PATCH reject campaign (admin only)
router.patch("/:id/reject", authMiddleware, hasPermission(PERMISSIONS.REJECT_CAMPAIGN), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        rejectionReason,
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Log activity
    await ActivityLog.create({
      userType: "admin",
      userId: req.userId,
      userName: req.userName || "Admin",
      action: "Campaign Rejected",
      details: `Rejected campaign: ${campaign.title} - Reason: ${rejectionReason}`,
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
    });

    res.status(200).json({
      message: "Campaign rejected",
      campaign,
    });
  } catch (err) {
    console.error("Error rejecting campaign:", err);
    res.status(500).json({ error: "Failed to reject campaign" });
  }
});

export default router;
