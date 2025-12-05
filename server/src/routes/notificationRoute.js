import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

/**
 * GET /api/notifications/:donorId
 * Fetch notifications for a specific donor ONLY
 * Security: Always filter by donorId to prevent data leakage
 */
router.get("/:donorId", async (req, res) => {
  try {
    const { donorId } = req.params;

    // Validate donorId exists and is not empty
    if (!donorId || typeof donorId !== "string" || donorId.trim() === "") {
      console.warn("[NOTIFICATION_ROUTE] Invalid donorId:", donorId);
      return res.status(400).json({ success: false, message: "Invalid donorId" });
    }

    const cleanDonorId = donorId.trim();
    console.log(`[NOTIFICATION_ROUTE] Fetching notifications for donorId: ${cleanDonorId}`);

    // CRITICAL: Filter by donorId to ensure security - no donor can see another's notifications
    const notifications = await Notification.find({ donorId: cleanDonorId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Ensure we always return an array, even if empty
    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    console.log(`[NOTIFICATION_ROUTE] Returned ${safeNotifications.length} notifications for donorId: ${cleanDonorId}`);

    return res.status(200).json(safeNotifications);
  } catch (error) {
    console.error("[NOTIFICATION_ROUTE] Error fetching notifications:", error.message);
    // Always return empty array on error - never crash the frontend
    return res.status(200).json([]);
  }
});

/**
 * POST /api/notifications
 * Create a notification for a donor
 */
router.post("/", async (req, res) => {
  try {
    const { donorId, message, type, title } = req.body;

    // Validate required fields
    if (!donorId || typeof donorId !== "string" || donorId.trim() === "") {
      console.warn("[NOTIFICATION_ROUTE] POST: Invalid donorId");
      return res.status(400).json({ success: false, message: "donorId is required" });
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      console.warn("[NOTIFICATION_ROUTE] POST: Invalid message");
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const notification = new Notification({
      donorId: donorId.trim(),
      message: message.trim(),
      type: type ?? "info",
      title: title ?? "",
      isRead: false,
    });

    const saved = await notification.save();

    console.log(`[NOTIFICATION_ROUTE] Created notification for donorId: ${donorId.trim()}`);

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: saved,
    });
  } catch (error) {
    console.error("[NOTIFICATION_ROUTE] Error creating notification:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create notification" });
  }
});

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a specific notification as read
 */
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      console.warn("[NOTIFICATION_ROUTE] PUT: Invalid notificationId");
      return res.status(400).json({ success: false, message: "notificationId is required" });
    }

    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      console.warn(`[NOTIFICATION_ROUTE] Notification not found: ${notificationId}`);
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    console.log(`[NOTIFICATION_ROUTE] Marked notification as read: ${notificationId}`);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error("[NOTIFICATION_ROUTE] Error marking as read:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update notification" });
  }
});

/**
 * DELETE /api/notifications/:notificationId
 * Delete a specific notification
 */
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      console.warn("[NOTIFICATION_ROUTE] DELETE: Invalid notificationId");
      return res.status(400).json({ success: false, message: "notificationId is required" });
    }

    const deleted = await Notification.findByIdAndDelete(notificationId);

    if (!deleted) {
      console.warn(`[NOTIFICATION_ROUTE] Notification not found for deletion: ${notificationId}`);
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    console.log(`[NOTIFICATION_ROUTE] Deleted notification: ${notificationId}`);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("[NOTIFICATION_ROUTE] Error deleting notification:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
});

/**
 * DELETE /api/notifications/donor/:donorId
 * Delete all notifications for a donor
 */
router.delete("/donor/:donorId", async (req, res) => {
  try {
    const { donorId } = req.params;

    if (!donorId || typeof donorId !== "string" || donorId.trim() === "") {
      console.warn("[NOTIFICATION_ROUTE] DELETE_DONOR: Invalid donorId");
      return res.status(400).json({ success: false, message: "Invalid donorId" });
    }

    const result = await Notification.deleteMany({ donorId: donorId.trim() });

    console.log(`[NOTIFICATION_ROUTE] Deleted ${result.deletedCount} notifications for donorId: ${donorId.trim()}`);

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[NOTIFICATION_ROUTE] Error deleting donor notifications:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete notifications" });
  }
});

export default router;

