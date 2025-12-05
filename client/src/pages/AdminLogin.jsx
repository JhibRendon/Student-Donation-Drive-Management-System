import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { ArrowLeft, Check, Briefcase } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Swal from "sweetalert2";
import { setAdminData, setAdminToken, clearAdminStorage } from "../utils/storageHelper.js";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [captchaValue, setCaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);

  // Suppress non-critical warnings that don't affect functionality
  useEffect(() => {
    const originalError = console.error;
    console.error = function(...args) {
      const errorStr = args[0]?.toString?.() || "";
      // Silently filter out known safe warnings from external libraries
      if (errorStr.includes("translationService") || 
          errorStr.includes("recaptcha") ||
          errorStr.includes("Cross-Origin-Opener-Policy")) {
        return; // Suppress these warnings
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  const handleCaptchaChange = (value) => setCaptchaValue(value);

  const handleBack = () => navigate("/");

  // ============================================
  // DONOR LOGIN HANDLER (REMOVED - Use /donor-login instead)
  // ============================================

  // ============================================
  // GOOGLE LOGIN HANDLER
  // ============================================
  const handleGoogleLogin = async (credentialResponse) => {
    console.log("🔐 Google Login initiated...");
    if (!credentialResponse?.credential) {
      console.error("❌ No credential in response");
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Google authentication failed. Please try again.",
      });
      return;
    }

    try {
      console.log("📤 Sending Google token to backend...");
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await axios.post(
        "http://localhost:5000/api/auth/google",
        {
          token: credentialResponse.credential,
          userType: "admin",
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const data = res.data;
      console.log("📦 Backend response:", data);

      const admin = data.admin || data.user;

      if (!data.success || !admin || !admin._id) {
        console.error("❌ Google login failed:", data.message);
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message || "Google authentication failed. Please try again.",
        });
        return;
      }

      // ✅ Backend already sends complete profile data, just use it directly
      const completeAdmin = {
        _id: admin._id || admin.adminId,
        adminId: admin._id || admin.adminId,
        // Save as both 'name' and 'adminName' for compatibility
        name: admin.name || admin.adminName || "Admin",
        adminName: admin.name || admin.adminName || "Admin",
        // Save as both 'email' and 'adminEmail' for compatibility
        email: admin.email || admin.adminEmail || "",
        adminEmail: admin.email || admin.adminEmail || "",
        // Avatar fields
        adminAvatar: admin.profileImage || admin.avatar || admin.adminAvatar || "",
        profileImage: admin.profileImage || "",
        avatar: admin.avatar || "",
        // Profile fields (all already sent by backend in Google response!)
        contactNumber: admin.contactNumber || "",
        address: admin.address || "",
        gender: admin.gender || "",
        birthday: admin.birthday || "",
        // RBAC fields
        role: admin.role || "admin",
        permissions: admin.permissions || [],
        accessLevel: admin.accessLevel || 60,
        // Metadata
        createdAt: admin.createdAt || "",
        googleId: admin.googleId || "",
      };

      console.log("✅ Google login successful! Complete data:", completeAdmin);
      console.log("📊 Profile fields received - Contact:", completeAdmin.contactNumber, "Address:", completeAdmin.address, "Gender:", completeAdmin.gender, "Birthday:", completeAdmin.birthday);
      console.log("🔐 RBAC fields - Role:", completeAdmin.role, "AccessLevel:", completeAdmin.accessLevel);
      
      // Multi-user support: use unique keys per admin
      const adminId = completeAdmin._id;
      setAdminData(completeAdmin);
      setAdminToken(data.token);
      sessionStorage.setItem("currentAdminId", adminId);
      sessionStorage.setItem("userType", "admin");
      
      const redirectPath = completeAdmin.role === "SuperAdmin" 
        ? "/super-admin-dashboard" 
        : "/admin-dashboard";
      
      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Welcome to the admin portal!",
        timer: 1500,
      });
      console.log("🔗 Redirecting to:", redirectPath);
      setTimeout(() => navigate(redirectPath), 200);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.error("🔴 Google login timeout (10s):", err);
        Swal.fire({
          icon: "error",
          title: "Request Timeout",
          text: "Authentication request took too long. Please try again.",
        });
      } else {
        console.error("🔴 Google login error:", err);
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: err.response?.data?.message || "Google authentication failed",
        });
      }
    }
  };

  // ============================================
  // ADMIN LOGIN HANDLER
  // ============================================
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    console.log("🔍 Form submitted, captchaValue:", captchaValue);

    if (!captchaValue) {
      console.warn("⚠️ reCAPTCHA not verified");
      Swal.fire({
        icon: "warning",
        title: "reCAPTCHA Required",
        text: "Please verify that you are not a robot",
      });
      return;
    }

    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value?.trim() || "";

    console.log("📧 Email:", email);
    console.log("🔒 Password:", password ? "***" : "empty");

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill in both email and password",
      });
      return;
    }

    setLoading(true);
    console.log("⏳ Attempting login...");
    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("📦 Response:", data);
      const admin = data.data?.admin || data.admin;
      const token = data.data?.token || data.token;

      if (data.success && admin) {
        console.log("✅ Login successful!");
        // Multi-user support: use unique keys per admin
        const adminId = admin._id;
        setAdminData(admin);
        setAdminToken(token);
        sessionStorage.setItem("currentAdminId", adminId);
        sessionStorage.setItem("userType", "admin");

        Swal.fire({
          icon: "success",
          title: "Login Successful!",
          timer: 1500,
        });
        
        const redirectPath = admin.role === "SuperAdmin" ? "/super-admin-dashboard" : "/admin-dashboard";
        console.log("🔗 Redirecting to:", redirectPath);
        navigate(redirectPath);
      } else {
        console.error("❌ Login failed:", data.message);
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message || "Invalid credentials",
        });
      }
    } catch (err) {
      console.error("🔴 Admin login error:", err);
      Swal.fire({
        icon: "error",
        title: "Login Error",
        text: "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the handler for form submission
  const getFormHandler = () => {
    return handleAdminLogin;
  };

  return (
    <div className="p-0 m-0 min-h-screen bg-white" id="BODY">
      {/* TWO COLUMN LAYOUT */}
      <div className="flex h-screen">
        {/* LEFT SIDE - BRANDED SECTION */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-600 via-red-600 to-rose-700 flex-col items-center justify-center px-12 py-12 relative overflow-hidden">
          {/* Decorative wave elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40"></div>

          <div className="relative z-10 text-center text-white max-w-sm">
            {/* Logo */}
            <div className="mb-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg">
                <Briefcase size={40} className="text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl font-bold mb-2">Manage Campaigns</h1>
              <p className="text-orange-100 text-lg">Enterprise Administration</p>
            </div>

            {/* Features */}
            <div className="space-y-5 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                  <Check size={18} className="text-white font-bold" strokeWidth={3} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Campaign Management</h3>
                  <p className="text-orange-100 text-sm">Full control over all campaigns</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                  <Check size={18} className="text-white font-bold" strokeWidth={3} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Analytics & Reports</h3>
                  <p className="text-orange-100 text-sm">Track donations and impact</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                  <Check size={18} className="text-white font-bold" strokeWidth={3} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Donor Management</h3>
                  <p className="text-orange-100 text-sm">Manage donors and relationships</p>
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="px-4 py-3 bg-white/10 border border-white/20 rounded-full inline-flex items-center gap-2">
              <span className="text-green-400">●</span>
              <span className="text-sm font-semibold text-orange-100">Secure Admin Portal</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-12 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 relative">
          {/* Close button - visible on all screens */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 text-slate-600 hover:text-slate-900 transition flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-200"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="w-full max-w-md">
            {/* Logo & Title */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Admin Sign In</h1>
              <p className="text-sm text-slate-600 mt-2">
                Access your admin account
              </p>
            </div>

            {/* Role Navigation Buttons */}
            <div className="flex gap-2 mb-8">
              <button
                type="button"
                onClick={() => navigate("/donor-login")}
                className="flex-1 py-2 px-3 rounded-md text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 transition"
              >
                DONOR
              </button>
              <button
                type="button"
                disabled
                className="flex-1 py-2 px-3 rounded-md text-sm font-semibold bg-orange-600 text-white shadow-md"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => navigate("/superadmin-login")}
                className="flex-1 py-2 px-3 rounded-md text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 transition"
              >
                SUPER
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* reCAPTCHA */}
              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                  Remember me
                </label>
                <a href="/admin-reset" className="text-orange-600 hover:text-orange-700 font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-white transition bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {/* Google Login */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleLogin} onError={() => console.log("Login Failed")} />
              </div>
            </form>

            {/* Signup Link */}
            <p className="text-center text-sm text-slate-600 mt-6">
              Don't have an account?{" "}
              <a href="/admin-registration" className="text-orange-600 font-semibold hover:text-orange-700">
                Sign up
              </a>
            </p>



            {/* Security Badge */}
            <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-700 leading-relaxed">
                🔐 <span className="font-semibold">Secure Access</span> - All login attempts are monitored for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
