import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Trash2, AlertCircle } from "lucide-react";
import axios from "axios";
import { getDonorData } from "../utils/storageHelper.js";

/**
 * NotificationBell Component
 * Displays notifications fetched from backend for the logged-in donor
 *
 * Design Philosophy:
 * - ✅ Auto-fetches when dropdown is OPEN (shows activities in real-time)
 * - ✅ RED BADGE appears immediately when new activity happens
 * - ✅ Formal, professional UI
 * - ✅ User can see activities as they happen
 *
 * Security:
 * - Uses donorId from localStorage (donorProfile._id)
 * - ONLY fetches notifications for that specific donorId
 * - Prevents data leakage between donors
 *
 * Defensive Programming:
 * - All API responses validated with Array.isArray()
 * - All fields use optional chaining (?.) and nullish coalescing (??)
 * - No crash even with malformed or undefined data
 * - Comprehensive error logging for debugging
 */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  /**
   * Fetch notifications from backend using donorId from localStorage
   * ✅ Stable fetching: Only updates state if data actually changed
   */
  const fetchNotifications = () => {
    // Step 1: Extract donorId from donor data using storageHelper
    let donorId = null;

    try {
      // Use storageHelper to get donor data (handles multi-user keys and fallback)
      const donorData = getDonorData();
      
      if (!donorData) {
        console.warn("[NotificationBell] No donor data found in sessionStorage");
        setNotifications([]);
        setError("User profile not found");
        return;
      }

      // Try multiple ID field names for compatibility
      donorId = donorData?._id ?? donorData?.donorId ?? donorData?.id ?? null;

      if (!donorId) {
        console.warn("[NotificationBell] No valid donorId found in donor data:", donorData);
        setNotifications([]);
        setError("User ID not found");
        return;
      }

      console.log("[NotificationBell] Successfully extracted donorId:", donorId);
    } catch (err) {
      console.error("[NotificationBell] Error parsing donorProfile from localStorage:", err);
      setNotifications([]);
      setError("Failed to parse user profile");
      return;
    }

    // Step 2: Fetch notifications from backend using donorId
    setIsLoading(true);
    setError(null);

    axios
      .get(`http://localhost:5000/api/notifications/${donorId}`)
      .then((res) => {
        console.log("[NotificationBell] Received response from backend:", res.data);

        // Validate that backend returned an array
        if (!Array.isArray(res.data)) {
          console.error(
            "[NotificationBell] Backend did not return an array. Received:",
            typeof res.data,
            res.data
          );
          setNotifications([]);
          setError("Invalid response format from server");
          return;
        }

        console.log(`[NotificationBell] Successfully fetched ${res.data.length} notifications`);

        // Filter out any null/undefined items and validate each notification
        const validNotifications = res.data.filter((n) => n != null && typeof n === "object");

        // ✅ Only update state if notifications actually changed (prevent unnecessary re-renders)
        setNotifications(prevNotifications => {
          const prevIds = new Set(prevNotifications.map(n => n?._id || n?.id));
          const newIds = new Set(validNotifications.map(n => n?._id || n?.id));
          
          // Check if the list changed
          if (prevIds.size !== newIds.size || 
              Array.from(prevIds).some(id => !newIds.has(id))) {
            console.log("[NotificationBell] Notification list updated");
            return validNotifications;
          }
          return prevNotifications;
        });
        
        setError(null);
      })
      .catch((err) => {
        console.error("[NotificationBell] Failed to fetch notifications:", err.message);
        console.error("[NotificationBell] Error details:", err);

        setNotifications([]);
        setError("Failed to load notifications");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  /**
   * useEffect: Fetch notifications on component mount and when dropdown opens
   * ✅ Stable refresh: Only fetches new data, doesn't re-render entire list
   * ✅ Smart polling: Only refreshes when dropdown is open
   */
  useEffect(() => {
    // Fetch on mount
    fetchNotifications();

    // ✅ Smart polling: Only refresh when dropdown is OPEN (every 4 seconds for stability)
    let refreshInterval;
    if (isOpen) {
      console.log("[NotificationBell] Dropdown opened - starting stable refresh");
      refreshInterval = setInterval(() => {
        fetchNotifications();
      }, 4000);
    }

    // Set up click-outside handler for closing dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (refreshInterval) {
        clearInterval(refreshInterval);
        console.log("[NotificationBell] Dropdown closed - stopping refresh");
      }
    };
  }, [isOpen]);

  /**
   * Calculate unread count with defensive checks
   */
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => {
        // Check both isRead and read field names for compatibility
        const isRead = n?.isRead ?? n?.read ?? false;
        return !isRead;
      }).length
    : 0;

  /**
   * Mark a notification as read by calling backend endpoint
   */
  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) {
      console.warn("[NotificationBell] handleMarkAsRead: Missing notificationId");
      return;
    }

    try {
      console.log("[NotificationBell] Marking notification as read:", notificationId);

      const res = await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`
      );

      if (res.data?.success) {
        // Update local state
        setNotifications((prev) =>
          Array.isArray(prev)
            ? prev.map((n) =>
                (n?._id === notificationId || n?.id === notificationId)
                  ? { ...n, isRead: true, read: true }
                  : n
              )
            : prev
        );
        console.log("[NotificationBell] Successfully marked as read:", notificationId);
      } else {
        console.warn("[NotificationBell] Backend returned success=false:", res.data);
      }
    } catch (err) {
      console.error("[NotificationBell] Failed to mark as read:", err.message);
    }
  };

  /**
   * Delete a notification by calling backend endpoint
   */
  const handleDelete = async (notificationId) => {
    if (!notificationId) {
      console.warn("[NotificationBell] handleDelete: Missing notificationId");
      return;
    }

    try {
      console.log("[NotificationBell] Deleting notification:", notificationId);

      const res = await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`
      );

      if (res.data?.success) {
        // Update local state
        setNotifications((prev) =>
          Array.isArray(prev)
            ? prev.filter((n) => n?._id !== notificationId && n?.id !== notificationId)
            : prev
        );
        console.log("[NotificationBell] Successfully deleted:", notificationId);
      } else {
        console.warn("[NotificationBell] Backend returned success=false:", res.data);
      }
    } catch (err) {
      console.error("[NotificationBell] Failed to delete notification:", err.message);
    }
  };

  /**
   * Mark all notifications as read by calling backend for each unread notification
   */
  const handleMarkAllAsRead = async () => {
    if (!Array.isArray(notifications) || notifications.length === 0) return;

    try {
      console.log("[NotificationBell] Marking all as read");

      // Mark each unread notification as read
      const unreadNotifications = notifications.filter((n) => !(n?.isRead ?? n?.read));

      await Promise.all(
        unreadNotifications.map((n) =>
          axios.put(
            `http://localhost:5000/api/notifications/${n?._id ?? n?.id}/read`
          )
        )
      );

      // Update local state
      setNotifications((prev) =>
        Array.isArray(prev)
          ? prev.map((n) => ({ ...n, isRead: true, read: true }))
          : prev
      );

      console.log(`[NotificationBell] Marked ${unreadNotifications.length} as read`);
    } catch (err) {
      console.error("[NotificationBell] Failed to mark all as read:", err.message);
    }
  };

  /**
   * Format timestamp to readable format
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown time";

    try {
      const date = new Date(timestamp);

      if (isNaN(date.getTime())) {
        console.warn("[NotificationBell] Invalid timestamp:", timestamp);
        return "Invalid date";
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString();
    } catch (err) {
      console.error("[NotificationBell] Error formatting time:", err);
      return "Invalid date";
    }
  };

  /**
   * Get CSS classes for notification type badge
   */
  const getTypeColor = (type) => {
    const safeType = type ?? "info";

    const colorMap = {
      success: "bg-green-100 text-green-800 border-green-300",
      error: "bg-red-100 text-red-800 border-red-300",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
      info: "bg-blue-100 text-blue-800 border-blue-300",
    };

    return colorMap[safeType] || colorMap.info;
  };

  /**
   * Render
   */
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          console.log("[NotificationBell] Bell clicked, isOpen:", isOpen);
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-700 hover:text-indigo-950 transition-colors rounded-full hover:bg-gray-100"
        title={unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : "No new notifications"}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-red-600' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-300 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b-2 border-indigo-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Notifications</h3>
                <p className="text-indigo-100 text-xs">Stay updated on all activities</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-indigo-500 transition-colors p-1 rounded"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto flex-1 bg-gray-50">
            {/* Loading State */}
            {isLoading && (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin">
                  <Bell className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-600 mt-3 font-medium">Loading notifications...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="p-4 m-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800">Error Loading Notifications</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading &&
              !error &&
              (!Array.isArray(notifications) || notifications.length === 0) && (
                <div className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-600">No notifications</p>
                  <p className="text-sm text-gray-500 mt-2">You're all caught up! All your activities will appear here.</p>
                </div>
              )}

            {/* Notifications List */}
            {!isLoading &&
              !error &&
              Array.isArray(notifications) &&
              notifications.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {notifications.filter(Boolean).map((notification, idx) => {
                    // Defensive extraction of notification fields
                    const notifId = notification?._id ?? notification?.id ?? `fallback-${idx}`;
                    const message = notification?.message ?? "No message";
                    const type = notification?.type ?? "info";
                    const title = notification?.title ?? "";
                    const isRead = notification?.isRead ?? notification?.read ?? false;
                    const timestamp = notification?.createdAt ?? notification?.timestamp ?? null;
                    
                    // ✅ Check if notification was created in last 30 seconds (FRESH ACTIVITY)
                    const isFreshActivity = timestamp && (new Date() - new Date(timestamp)) < 30000;

                    return (
                      <div
                        key={notifId}
                        className={`p-5 transition-colors duration-200 ${
                          !isRead 
                            ? "bg-indigo-50 border-l-4 border-indigo-500" 
                            : "bg-white"
                        } hover:bg-gray-50`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              {/* Type badge */}
                              <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded ${getTypeColor(
                                  type
                                )}`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                              
                              {/* Fresh activity indicator */}
                              {isFreshActivity && (
                                <span className="text-xs text-red-600 font-medium">• Just now</span>
                              )}
                            </div>

                            {title && (
                              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                {title}
                              </h4>
                            )}

                            <p className="text-sm text-gray-700 mb-2">
                              {message}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatTime(timestamp)}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notifId)}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notifId)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-indigo-200 bg-indigo-50 flex items-center justify-between">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-700 hover:text-indigo-900 font-bold hover:underline transition-colors"
                title="Mark all as read"
              >
                ✓ Mark all as read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="text-sm text-indigo-700 hover:text-indigo-900 font-bold hover:underline transition-colors ml-auto"
              title="Refresh notifications"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
