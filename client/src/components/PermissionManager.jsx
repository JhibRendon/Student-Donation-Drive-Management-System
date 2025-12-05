import React, { useState } from "react";
import { Check, X } from "lucide-react";

const PERMISSIONS_CONFIG = {
  "Campaign Management": [
    { id: "create_campaign", label: "Create Campaign", description: "Create new donation campaigns" },
    { id: "view_campaigns", label: "View Campaigns", description: "View all campaign details" },
    { id: "approve_campaign", label: "Approve Campaign", description: "Approve pending campaigns" },
    { id: "reject_campaign", label: "Reject Campaign", description: "Reject campaign submissions" },
    { id: "edit_campaign", label: "Edit Campaign", description: "Modify existing campaigns" },
    { id: "delete_campaign", label: "Delete Campaign", description: "Delete campaigns permanently" },
  ],
  "Donation Management": [
    { id: "view_donations", label: "View Donations", description: "View donation records" },
    { id: "manage_donations", label: "Manage Donations", description: "Edit or process donations" },
  ],
  "Admin Management": [
    { id: "create_admin", label: "Create Admin", description: "Create new admin accounts" },
    { id: "view_admins", label: "View Admins", description: "View all admin accounts" },
    { id: "edit_admin", label: "Edit Admin", description: "Modify admin details" },
    { id: "delete_admin", label: "Delete Admin", description: "Delete admin accounts" },
  ],
  "Donor Management": [
    { id: "view_donors", label: "View Donors", description: "View donor information" },
    { id: "manage_donors", label: "Manage Donors", description: "Edit donor details and records" },
  ],
  "System Management": [
    { id: "manage_categories", label: "Manage Categories", description: "Create and manage categories" },
    { id: "view_activity_logs", label: "View Activity Logs", description: "Access audit trails and logs" },
    { id: "manage_system_settings", label: "Manage Settings", description: "Configure system settings" },
  ],
};

const PermissionManager = ({ selectedPermissions, setSelectedPermissions, onSave, saving, accessLevel }) => {
  const [expandedCategory, setExpandedCategory] = useState("Campaign Management");

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const isPermissionSelected = (permissionId) => {
    return selectedPermissions.includes(permissionId);
  };

  const getAllPermissionsInCategory = (category) => {
    return PERMISSIONS_CONFIG[category].map((p) => p.id);
  };

  const areAllInCategorySelected = (category) => {
    const allInCategory = getAllPermissionsInCategory(category);
    return allInCategory.every((p) => selectedPermissions.includes(p));
  };

  const toggleCategory = (category) => {
    if (areAllInCategorySelected(category)) {
      // Deselect all in category
      setSelectedPermissions((prev) =>
        prev.filter((p) => !getAllPermissionsInCategory(category).includes(p))
      );
    } else {
      // Select all in category
      setSelectedPermissions((prev) => [
        ...new Set([...prev, ...getAllPermissionsInCategory(category)]),
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Access Level Indicator */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Calculated Access Level</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{accessLevel}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Formula: 20% + (Perms ÷ 15) × 80%</p>
            <p className="text-3xl">
              {accessLevel === 100 ? "🟢" : accessLevel >= 80 ? "🔵" : accessLevel >= 60 ? "🟡" : "🟠"}
            </p>
          </div>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="space-y-3">
        {Object.entries(PERMISSIONS_CONFIG).map(([category, permissions]) => (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={areAllInCategorySelected(category)}
                  onChange={() => toggleCategory(category)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-semibold text-gray-800">{category}</span>
                <span className="text-sm text-gray-500">
                  ({permissions.filter((p) => isPermissionSelected(p.id)).length}/{permissions.length})
                </span>
              </div>
              <div className="text-gray-400">
                {expandedCategory === category ? "▼" : "▶"}
              </div>
            </button>

            {/* Category Permissions */}
            {expandedCategory === category && (
              <div className="bg-white divide-y divide-gray-100">
                {permissions.map((permission) => (
                  <div key={permission.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isPermissionSelected(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer mt-0.5"
                      />
                      <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="font-medium text-gray-800">{permission.label}</span>
                          {isPermissionSelected(permission.id) && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </label>
                        <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Permission Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">{selectedPermissions.length}</span> of{" "}
          <span className="font-semibold">15</span> permissions selected
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Permissions"}
      </button>
    </div>
  );
};

export default PermissionManager;
