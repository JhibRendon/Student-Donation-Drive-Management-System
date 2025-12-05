import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Gift, Users, FileText, LogOut, Settings, 
  Activity, User, Mail, Save, Upload, Archive
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { getAdminData, getAdminToken, clearAdminStorage, setAdminData } from "../utils/storageHelper.js";

const AdminProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", profileImage: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const adminData = getAdminData();
    if (adminData) {
      try {
        const firstName = adminData.name ? adminData.name.split(" ")[0] : "Admin";
        setAdmin(adminData);
        setFormData({
          name: adminData.name || "",
          email: adminData.email || "",
          profileImage: adminData.profileImage || "",
        });
      } catch (err) {
        console.error("Error parsing admin:", err);
      }
    }
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "donateflow_uploads");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dlbggnbeu/image/upload",
        { method: "POST", body: data }
      );
      const fileData = await res.json();
      setFormData({ ...formData, profileImage: fileData.secure_url });
    } catch (err) {
      console.error("Upload failed:", err);
      Swal.fire({ title: "Error", text: "Failed to upload image", icon: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      // Only update account info (name), not profileImage (which is updated separately)
      const response = await axios.put("http://localhost:5000/api/admin/profile", {
        email: formData.email,
        name: formData.name,
        // Note: profileImage is updated separately via "Update Avatar Only" button
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const updatedAdmin = { ...admin, ...response.data.admin };
        setAdminData(updatedAdmin);
        setAdmin(updatedAdmin);
        Swal.fire({
          title: "Success!",
          text: "Account information updated successfully",
          icon: "success",
          timer: 1500,
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({ title: "Error", text: "Failed to update profile", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        clearAdminStorage();
        navigate("/login-admin");
      }
    });
  };

  const handleSidebar = (path) => navigate(path);
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-72 bg-indigo-950 text-white flex flex-col py-8 relative">
        <div className="flex flex-col items-center flex-1">
          <div className="text-center mb-8">
            <img src="/logo_white.png" alt="Logo" className="w-20 mx-auto mb-2" />
            <h1 className="text-lg font-semibold leading-tight text-center">
              Student Donation Drive <br /> Management System
            </h1>
          </div>

          <div className="flex items-center justify-center bg-gray-700 rounded-full px-4 py-2 mb-6 w-56">
            <div className="w-10 h-10 bg-white rounded-full mr-3 flex-shrink-0"></div>
            <span className="font-semibold text-center truncate">
              {admin?.firstName || admin?.name || "Admin"}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-center">ADMIN</h2>
          <hr className="border-white w-3/4 mb-6" />

          <nav className="w-full flex flex-col items-center space-y-2 flex-1">
            <SidebarBtn
              icon={<LayoutDashboard className="w-5 h-5" />}
              text="Dashboard"
              onClick={() => handleSidebar("/admin-dashboard")}
              active={isActive("/admin-dashboard")}
            />
            <SidebarBtn
              icon={<Gift className="w-5 h-5" />}
              text="Manage Campaigns"
              onClick={() => handleSidebar("/manage-campaigns")}
              active={isActive("/manage-campaigns")}
            />
            <SidebarBtn
              icon={<Archive className="w-5 h-5" />}
              text="Archive"
              onClick={() => handleSidebar("/archive")}
              active={isActive("/archive")}
            />
            <SidebarBtn
              icon={<FileText className="w-5 h-5" />}
              text="Reports"
              onClick={() => handleSidebar("/reports")}
              active={isActive("/reports")}
            />
            <SidebarBtn
              icon={<Gift className="w-5 h-5" />}
              text="Past Donations"
              onClick={() => handleSidebar("/admin-past-donations")}
              active={isActive("/admin-past-donations")}
            />
            <SidebarBtn
              icon={<Users className="w-5 h-5" />}
              text="Manage Donors"
              onClick={() => handleSidebar("/manage-donors")}
              active={isActive("/manage-donors")}
            />
            <SidebarBtn
              icon={<Activity className="w-5 h-5" />}
              text="Activity Logs"
              onClick={() => handleSidebar("/activity-logs")}
              active={isActive("/activity-logs")}
            />
            <SidebarBtn
              icon={<Settings className="w-5 h-5" />}
              text="Settings"
              onClick={() => handleSidebar("/admin-settings")}
              active={isActive("/admin-settings")}
            />
          </nav>
        </div>

        {/* Logout Button - Consistent with SuperAdmin */}
        <div className="border-t border-indigo-900 pt-4 px-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-900 transition flex items-center gap-3 text-red-400 hover:text-red-300"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-indigo-950">Profile</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your admin profile information</p>
        </header>

        <div className="max-w-3xl">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-indigo-100">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-indigo-950 text-white px-4 py-2 rounded-lg hover:bg-indigo-900 transition flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const token = getAdminToken();
                    const response = await axios.put("http://localhost:5000/api/admin/profile", {
                      email: formData.email,
                      profileImage: formData.profileImage,
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data.success) {
                      const updatedAdmin = { ...admin, ...response.data.admin };
                      setAdminData(updatedAdmin);
                      setAdmin(updatedAdmin);
                      Swal.fire({
                        title: "Success!",
                        text: "Profile picture updated successfully",
                        icon: "success",
                        timer: 1500,
                      });
                    }
                  } catch (error) {
                    Swal.fire({ title: "Error", text: "Failed to update profile picture", icon: "error" });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !formData.profileImage}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-950 text-white font-semibold rounded-lg hover:bg-indigo-900 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Update Avatar Only"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-10 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full border-2 border-gray-300 rounded-lg px-10 py-2.5 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-950 text-white font-semibold rounded-lg hover:bg-indigo-900 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Update Account Info"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SidebarBtn = ({ icon, text, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg w-56 font-semibold transition ${
      active ? "bg-gray-700" : "hover:bg-gray-700"
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default AdminProfile;

