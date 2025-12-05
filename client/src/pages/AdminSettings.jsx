import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Gift, Users, FileText, LogOut, Settings, 
  Activity, Lock, Eye, EyeOff, User, Save, Upload, Mail, Archive, MapPin, Phone
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { getAdminData, getAdminToken, getSuperAdminData, getSuperAdminToken, getAdminEmail, clearAdminStorage, setAdminData } from "../utils/storageHelper.js";

const AdminSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: "",
    avatar: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    console.log("\n========== 🔍 AdminSettings useEffect START ==========");
    console.log("Timestamp:", new Date().toLocaleTimeString());
    
    const adminData = getAdminData() || getSuperAdminData();
    const token = getAdminToken() || getSuperAdminToken();

    console.log("📋 STORAGE CHECK:");
    console.log("  - admin data exists:", !!adminData);
    console.log("  - token exists:", !!token);

    // Try primary admin key first
    if (adminData) {
      console.log("\n✅ Found admin data");
      try {
        console.log("📦 Parsed admin object:", adminData);
        console.log("   - Type:", typeof adminData);
        console.log("   - Keys:", Object.keys(adminData));
        
        // Log each field separately for clarity
        console.log("\n📊 Field Analysis:");
        console.log("   name:", {value: adminData.name, type: typeof adminData.name, empty: !adminData.name});
        console.log("   email:", {value: adminData.email, type: typeof adminData.email, empty: !adminData.email});
        console.log("   _id:", {value: adminData._id, type: typeof adminData._id, empty: !adminData._id});
        console.log("   avatar:", {value: adminData.avatar, type: typeof adminData.avatar, empty: !adminData.avatar});
        console.log("   profileImage:", {value: adminData.profileImage, type: typeof adminData.profileImage, empty: !adminData.profileImage});
        console.log("   contactNumber:", {value: adminData.contactNumber, type: typeof adminData.contactNumber, empty: !adminData.contactNumber});
        console.log("   address:", {value: adminData.address, type: typeof adminData.address, empty: !adminData.address});
        
        // Extract values with fallbacks
        const fullName = adminData.name || adminData.adminName || "Admin";
        const emailAddress = adminData.email || adminData.adminEmail || "";
        const firstName = fullName.split(" ")[0];
        const profileImage = adminData.avatar || adminData.profileImage || "";
        const contactNumber = adminData.contactNumber || "";
        const address = adminData.address || "";
        
        console.log("\n🎯 Extracted & Processed Values:");
        console.log("   fullName:", fullName);
        console.log("   emailAddress:", emailAddress);
        console.log("   firstName:", firstName);
        console.log("   profileImage:", profileImage);
        console.log("   contactNumber:", contactNumber);
        console.log("   address:", address);
        
        // Validate email is not empty
        if (!emailAddress || emailAddress.trim() === "") {
          console.warn("⚠️ CRITICAL: Email is EMPTY! This will cause form to appear blank!");
        } else {
          console.log("✅ Email validation passed:", emailAddress);
        }
        
        console.log("\n📝 Setting state with values:");
        const adminState = { name: fullName, firstName, email: emailAddress, _id: adminData._id, ...adminData };
        const formState = {
          name: fullName,
          email: emailAddress,
          contactNumber: contactNumber,
          address: address,
          avatar: profileImage,
        };
        
        console.log("   Admin state:", adminState);
        console.log("   Form state:", formState);
        
        setAdmin(adminState);
        setFormData(formState);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        
        console.log("========== ✅ AdminSettings useEffect COMPLETE (admin key) ==========\n");
        return;
      } catch (err) {
        console.error("❌ PARSE ERROR:", err.message);
        console.error("   Stack:", err.stack);
      }
    }

    // Fallback to adminProfile key
    if (storedAdminProfile) {
      console.log("\n✅ Found 'adminProfile' key in localStorage (fallback)");
      try {
        const adminData = JSON.parse(storedAdminProfile);
        console.log("📦 Parsed adminProfile object:", adminData);
        
        const fullName = adminData.fullName || adminData.name || "Admin";
        const emailAddress = adminData.email || "";
        const firstName = fullName.split(" ")[0];
        
        console.log("🎯 Extracted values:", { fullName, emailAddress, firstName });
        
        setAdmin({ name: fullName, firstName, email: emailAddress, _id: adminData._id, ...adminData });
        setFormData({
          name: fullName,
          email: emailAddress,
          contactNumber: adminData.contactNumber || "",
          address: adminData.address || "",
          avatar: adminData.avatar || adminData.profileImage || "",
        });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        
        console.log("========== ✅ AdminSettings useEffect COMPLETE (adminProfile key) ==========\n");
        return;
      } catch (err) {
        console.error("❌ Parse error:", err);
      }
    }

    console.log("❌ CRITICAL: No admin data found in localStorage!");
    console.log("   Available localStorage keys:", Object.keys(localStorage).join(", "));
    console.log("========== ❌ AdminSettings useEffect COMPLETE (no data) ==========\n");
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "donateflow_uploads");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dlbggnbeu/image/upload",
        { method: "POST", body: data }
      );
      const fileData = await res.json();
      const avatarUrl = fileData.secure_url;
      
      // Update BOTH formData and admin state for immediate sidebar update
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
      setAdmin(prev => ({ ...prev, avatar: avatarUrl }));
      
      // 🔄 Update sessionStorage immediately so other pages see the change
      const adminData = getAdminData() || {};
      const updatedAdmin = { ...adminData, avatar: avatarUrl };
      setAdminData(updatedAdmin);
      
      // 📢 Dispatch event to update all admin pages in real-time
      window.dispatchEvent(new CustomEvent("adminDataUpdated", {
        detail: { 
          avatar: avatarUrl,
          name: admin?.name,
          email: admin?.email,
          firstName: admin?.firstName
        },
        bubbles: true,
        cancelable: true
      }));
      console.log("🔔 Avatar updated event dispatched to all pages");
      
      // ✅ Create notification for avatar update
      Swal.fire({
        icon: "success",
        title: "Avatar Uploaded!",
        text: "Your avatar has been updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload avatar. Please try again.",
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Predefined avatar options
  const avatarOptions = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=admin1",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=admin2",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=admin3",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=admin4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=admin5",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=admin6",
  ];

  const selectAvatar = (avatarUrl) => {
    // Update BOTH formData and admin state for immediate sidebar update
    setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    setAdmin(prev => ({ ...prev, avatar: avatarUrl }));
    
    // 🔄 Update sessionStorage immediately so other pages see the change
    const adminData = getAdminData() || {};
    const updatedAdmin = { ...adminData, avatar: avatarUrl };
    setAdminData(updatedAdmin);
    
    // 📢 Dispatch event to update all admin pages in real-time
    window.dispatchEvent(new CustomEvent("adminDataUpdated", {
      detail: { 
        avatar: avatarUrl,
        name: admin?.name,
        email: admin?.email,
        firstName: admin?.firstName
      },
      bubbles: true,
      cancelable: true
    }));
    console.log("🔔 Avatar selected event dispatched to all pages");
    
    // ✅ Create notification for preset avatar selection
    Swal.fire({
      icon: "success",
      title: "Avatar Selected!",
      text: "Avatar selected successfully!",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setAccountLoading(true);

    console.log("💾 Submitting form data:", formData);

    try {
      const token = getAdminToken() || getSuperAdminToken();
      console.log("🔐 Token retrieved - Length:", token?.length || 0, "Valid:", token ? "✓ Yes" : "✗ No");
      
      if (!token) {
        console.error("❌ NO TOKEN FOUND!");
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Session expired. Please login again.",
        });
        setAccountLoading(false);
        return;
      }
      
      // Get email with proper validation
      let email = formData.email;
      if (!email) {
        email = admin?.email;
      }
      if (!email) {
        email = getAdminEmail();
      }
      
      // Check if email exists and is valid
      if (!email || email.trim() === "") {
        console.error("❌ Email is required but not found!");
        Swal.fire({
          icon: "error",
          title: "Email Required",
          text: "Email is required. Please refresh and try again.",
        });
        setAccountLoading(false);
        return;
      }
      
      console.log("📤 Sending to backend:", { email: email.toLowerCase(), name: formData.name, contactNumber: formData.contactNumber, address: formData.address, avatar: formData.avatar });
      
      const authHeader = `Bearer ${token}`;
      console.log("🔑 Auth header format:", authHeader.substring(0, 30) + "...");
      console.log("📡 Making request to /api/admin/profile with token length:", token.length);
      
      // Update backend with all account info including avatar
      const response = await axios.put(
        "http://localhost:5000/api/admin/profile",
        {
          email: email.toLowerCase(),
          name: formData.name,
          contactNumber: formData.contactNumber,
          address: formData.address,
          avatar: formData.avatar,
          profileImage: formData.avatar,
        },
        { headers: { Authorization: authHeader } }
      );

      console.log("✅ Backend response:", response.data);

      if (response.data.success) {
        // Update localStorage with complete admin data
        const adminData = response.data.admin;
        const firstName = adminData.name ? adminData.name.split(" ")[0] : "Admin";
        const updatedAdmin = {
          _id: adminData._id,
          name: adminData.name,
          email: adminData.email,
          contactNumber: adminData.contactNumber,
          address: adminData.address,
          avatar: adminData.avatar || adminData.profileImage || formData.avatar || "",
          profileImage: adminData.profileImage || adminData.avatar || "",
          createdAt: adminData.createdAt,
          firstName: firstName,
        };
        
        console.log("✅ Updated sessionStorage with:", { name: adminData.name, email: adminData.email });
        
        // Save to sessionStorage using helper
        setAdminData(updatedAdmin);
        setAdmin(updatedAdmin);
        setFormData({ ...formData, ...updatedAdmin });
        
        // 📢 Dispatch event to update all admin pages in real-time
        window.dispatchEvent(new CustomEvent("adminDataUpdated", {
          detail: { 
            avatar: updatedAdmin.avatar,
            name: updatedAdmin.name,
            email: updatedAdmin.email,
            firstName: firstName
          },
          bubbles: true,
          cancelable: true
        }));
        console.log("🔔 Admin data updated event dispatched");
        
        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Account information updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      const errorMsg = error.response?.data?.message || "Failed to update profile. Please try again.";
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: errorMsg,
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Password Mismatch",
        text: "New passwords do not match",
        timer: 1500,
        showConfirmButton: false,
      });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "Password must be at least 6 characters long",
        timer: 1500,
        showConfirmButton: false,
      });
      setPasswordLoading(false);
      return;
    }

    try {
      const token = getAdminToken() || getSuperAdminToken();
      console.log("🔐 Token retrieved - Length:", token?.length || 0, "Valid:", token ? "✓ Yes" : "✗ No");
      
      if (!token) {
        console.error("❌ NO TOKEN FOUND!");
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Session expired. Please login again.",
        });
        setPasswordLoading(false);
        return;
      }
      
      let email = formData.email;
      if (!email) {
        email = admin?.email;
      }
      if (!email) {
        email = getAdminEmail();
      }
      
      if (!email || email.trim() === "") {
        Swal.fire({
          icon: "error",
          title: "Email Required",
          text: "Email is required. Please refresh and try again.",
        });
        setPasswordLoading(false);
        return;
      }
      
      console.log("💾 Submitting password change for email:", email.toLowerCase());
      
      const authHeader = `Bearer ${token}`;
      console.log("🔑 Auth header format:", authHeader.substring(0, 30) + "...");
      console.log("📡 Making request to /api/admin/change-password with token length:", token.length);
      
      const response = await axios.put(
        "http://localhost:5000/api/admin/change-password",
        {
          email: email.toLowerCase(),
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: authHeader } }
      );

      if (response.data.success) {
        console.log("✅ Password changed successfully");
        Swal.fire({
          icon: "success",
          title: "Password Changed!",
          text: "Password changed successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("❌ Error changing password:", error);
      const errorMsg = error.response?.data?.message || "Failed to change password. Please try again.";
      Swal.fire({
        icon: "error",
        title: "Change Failed",
        text: errorMsg,
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      setPasswordLoading(false);
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
    //
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* SIDEBAR */}
     <aside className="w-60 bg-indigo-950 text-white flex flex-col py-6 fixed left-0 top-0 h-screen">
  {/* Scrollable section */}
  <div className="flex flex-col items-center flex-1 overflow-y-auto px-2">
    <div className="text-center mb-6">
      <img src="/logo_white.png" alt="Logo" className="w-14 mx-auto mb-2" />
      <h1 className="text-sm font-medium leading-tight text-center">
        Student Donation Drive <br /> Management System
      </h1>
    </div>

          <div className="flex items-center justify-center bg-indigo-900 rounded-full px-3 py-2 mb-5 w-44">
            {admin?.profileImage || admin?.avatar || formData?.profileImage || formData?.avatar ? (
              <img 
                src={admin?.profileImage || admin?.avatar || formData?.profileImage || formData?.avatar} 
                alt="Profile" 
                className="w-8 h-8 rounded-full mr-2 flex-shrink-0 object-cover border-2 border-white"
              />
            ) : (
              <div className="w-8 h-8 bg-white rounded-full mr-2 flex-shrink-0"></div>
            )}
            <span className="font-semibold text-sm text-center truncate justify-center">
              {admin?.firstName || admin?.name || "Admin"}
            </span>
          </div>

          <h2 className="text-lg font-bold mb-3 tracking-wide text-center">ADMIN</h2>
          <hr className="border-white/30 w-3/4 mb-5 mx-auto" />

          <nav className="w-full flex flex-col items-center space-y-1 flex-1">
            <SidebarBtn
              icon={<LayoutDashboard className="w-4 h-4" />}
              text="Dashboard"
              onClick={() => handleSidebar("/admin-dashboard")}
              active={isActive("/admin-dashboard")}
            />
            <SidebarBtn
              icon={<Gift className="w-4 h-4" />}
              text="Manage Campaigns"
              onClick={() => handleSidebar("/manage-campaigns")}
              active={isActive("/manage-campaigns")}
            />
            <SidebarBtn
              icon={<Archive className="w-4 h-4" />}
              text="Archive"
              onClick={() => handleSidebar("/archive")}
              active={isActive("/archive")}
            />
            <SidebarBtn
              icon={<FileText className="w-4 h-4" />}
              text="Reports"
              onClick={() => handleSidebar("/reports")}
              active={isActive("/reports")}
            />
            <SidebarBtn
              icon={<Gift className="w-4 h-4" />}
              text="Past Donations"
              onClick={() => handleSidebar("/admin-past-donations")}
              active={isActive("/admin-past-donations")}
            />
            <SidebarBtn
              icon={<Users className="w-4 h-4" />}
              text="Manage Donors"
              onClick={() => handleSidebar("/manage-donors")}
              active={isActive("/manage-donors")}
            />
            <SidebarBtn
              icon={<Activity className="w-4 h-4" />}
              text="Activity Logs"
              onClick={() => handleSidebar("/activity-logs")}
              active={isActive("/activity-logs")}
            />
            <SidebarBtn
              icon={<Settings className="w-4 h-4" />}
              text="Settings"
              onClick={() => handleSidebar("/admin-settings")}
              active={isActive("/admin-settings")}
            />
          </nav>
        </div>

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
      <main className="flex-1 p-6 ml-60">
        <header className="flex justify-between items-center border-b-2 border-indigo-950 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your admin account information and preferences</p>
          </div>
        </header>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - AVATAR SECTION */}
          <div className="space-y-6">
            {/* AVATAR CARD */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl border-2 border-indigo-200 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-950">Profile Picture</h2>
                  <p className="text-sm text-gray-600">Upload or choose an avatar</p>
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-6">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4 overflow-hidden border-4 border-white shadow-xl ring-4 ring-indigo-200">
                    {formData.avatar || formData.profileImage ? (
                      <img src={formData.avatar || formData.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-200 to-purple-200">
                        <User className="w-20 h-20 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  {(formData.avatar || formData.profileImage) && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                      ✓ Active
                    </div>
                  )}
                </div>

                <label className="cursor-pointer bg-gradient-to-r from-indigo-950 to-purple-950 text-white px-6 py-3 rounded-xl hover:from-indigo-900 hover:to-purple-900 transition-all duration-200 flex items-center gap-2 mb-4 shadow-lg hover:shadow-xl font-semibold">
                  <Upload className="w-5 h-5" />
                  {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>

                <div className="w-full mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Or choose a preset avatar:</p>
                  <div className="grid grid-cols-6 gap-3">
                    {avatarOptions.map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectAvatar(avatarUrl)}
                        className={`w-14 h-14 rounded-full overflow-hidden border-3 transition-all transform hover:scale-110 ${
                          (formData.avatar || formData.profileImage) === avatarUrl
                            ? "border-indigo-600 ring-4 ring-indigo-300 shadow-lg scale-110"
                            : "border-gray-300 hover:border-indigo-400 hover:shadow-md"
                        }`}
                      >
                        <img src={avatarUrl} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const token = getAdminToken() || getSuperAdminToken();
                      const authHeader = `Bearer ${token}`;
                      const avatarUrl = formData.avatar || formData.profileImage;
                      const response = await axios.put(
                        "http://localhost:5000/api/admin/profile",
                        {
                          email: formData.email,
                          profileImage: avatarUrl,
                          avatar: avatarUrl, // Support both fields
                        },
                        { headers: { Authorization: authHeader } }
                      );
                      if (response.data.success) {
                        const updatedAdmin = { ...admin, ...response.data.admin };
                        setAdminData(updatedAdmin);
                        setAdmin(updatedAdmin);
                        setFormData({ ...formData, profileImage: avatarUrl, avatar: avatarUrl });
                        Swal.fire({
                          icon: "success",
                          title: "Avatar Updated!",
                          text: "Profile picture updated successfully!",
                          timer: 1500,
                          showConfirmButton: false,
                        });
                      }
                    } catch (error) {
                      Swal.fire({
                        icon: "error",
                        title: "Update Failed",
                        text: "Failed to update profile picture",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !(formData.avatar || formData.profileImage)}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Save className="w-5 h-5" />
                  {loading ? "Saving..." : "Update Avatar Only"}
                </button>
              </div>
            </div>

            {/* ADMIN STATS CARD */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl border-2 border-blue-200 p-6 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Admin Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Admin Role</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                    Administrator
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Profile Complete</span>
                  <span className="text-sm font-semibold text-indigo-600">
                    {formData.name && formData.contactNumber ? "100%" : "60%"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Access Level</span>
                  <span className={`text-sm font-semibold ${
                    admin?.accessLevel === 100 
                      ? "text-green-600" 
                      : admin?.accessLevel >= 80 
                      ? "text-blue-600" 
                      : admin?.accessLevel >= 60 
                      ? "text-yellow-600" 
                      : "text-orange-600"
                  }`}>
                    {admin?.accessLevel ? `${admin.accessLevel}%` : "N/A"}
                    {admin?.role === "SuperAdmin" && " (Full Admin)"}
                    {admin?.role === "Admin" && admin?.accessLevel < 100 && " (Limited)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - ACCOUNT INFO & PASSWORD */}
          <div className="space-y-6">
            {/* PROFILE SECTION */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-950">Account Information</h2>
                  <p className="text-sm text-gray-600">Update your admin details</p>
                </div>
              </div>

              {/* Message rendering removed - now using SweetAlert2 */}

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 bg-gray-100 cursor-not-allowed shadow-sm"
                      placeholder="Email (cannot be changed)"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Email cannot be changed for security reasons
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="text"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 11) {
                          handleChange({ target: { name: "contactNumber", value } });
                        }
                      }}
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
                      placeholder="09XX XXX XXXX"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-indigo-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={accountLoading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <Save className="w-5 h-5" />
                    {accountLoading ? "Saving..." : "Update Account Info"}
                  </button>
                </div>
              </form>
            </div>

            {/* PASSWORD SECTION */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-950">Change Password</h2>
                  <p className="text-sm text-gray-600">Update your admin account password</p>
                </div>
              </div>

              {/* Message rendering removed - now using SweetAlert2 */}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter current password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
                      placeholder="Confirm new password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <Lock className="w-5 h-5" />
                    {passwordLoading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
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
    className={`flex items-center gap-2 px-4 py-2 rounded-md w-48 font-medium text-sm transition ${
      active ? "bg-gray-700" : "hover:bg-gray-700/60"
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default AdminSettings;

