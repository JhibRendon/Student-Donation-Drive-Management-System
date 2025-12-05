import { GoogleLogin } from "@react-oauth/google";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import Swal from "sweetalert2";
import { Briefcase, ArrowLeft } from "lucide-react";
import { setAdminData, setAdminToken } from "../utils/storageHelper.js";

const Admin_Registration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [captchaValue, setCaptchaValue] = useState(null);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("admin");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!formData.firstname || !formData.lastname) {
      setMessage("❌ Please enter both first name and last name.");
      return;
    }

    if (!formData.email) {
      setMessage("❌ Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    if (!formData.password) {
      setMessage("❌ Please enter a password.");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("❌ Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    if (!captchaValue) {
      setMessage("❌ Please verify the reCAPTCHA before proceeding.");
      return;
    }

    try {
      setMessage("⏳ Registering your account...");

      const res = await axios.post("http://localhost:5000/api/admin/register", {
        name: `${formData.firstname} ${formData.lastname}`.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (res.data.success) {
        setMessage("✅ Registration successful! Redirecting to login...");
        // Store email temporarily for login page (optional)
        sessionStorage.setItem("registeredAdminEmail", formData.email.trim().toLowerCase());
        setTimeout(() => {
          navigate("/login-admin");
        }, 2000);
      } else {
        setMessage(res.data.message || "❌ Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "❌ Server error. Please try again later.";

      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = "❌ Cannot connect to server. Please check if the server is running.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      setMessage(errorMessage);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        token: credentialResponse.credential,
        userType: "admin",
      });

      const data = response.data;

      if (!data.success) {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: "Google registration failed. Please try again.",
        });
        return;
      }

      // ✅ Accepts both structures from initial auth response
      const admin = data.admin || data.user;

      if (!admin || !admin._id) {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: "No admin data returned from server.",
        });
        return;
      }

      const adminId = admin._id;
      // ✅ Capture email from Google Auth (primary source for email)
      const googleEmail = admin.email || data.email || "";

      // ✅ Fetch full admin profile for complete data
      let profileData = admin; // Default fallback
      try {
        const profileRes = await axios.get(
          `http://localhost:5000/api/admin/profile/${adminId}`
        );
        profileData = profileRes.data?.admin || profileRes.data?.user || admin;
      } catch (profileErr) {
        console.warn("⚠️ Could not fetch full profile, using initial data:", profileErr);
        // Continue with admin data if profile fetch fails
      }

      // ✅ Build complete admin object with proper fallbacks
      const completeAdmin = {
        _id: profileData._id || adminId,
        adminId: profileData._id || adminId,
        // Save as both 'name' and 'adminName' for compatibility
        name: profileData.name || admin.name || "Admin",
        adminName: profileData.name || admin.name || "Admin",
        // Save as both 'email' and 'adminEmail' for compatibility
        email: googleEmail || profileData.email || admin.email || "",
        adminEmail: googleEmail || profileData.email || admin.email || "",
        // Avatar fields
        profileImage: profileData.profileImage || admin.profileImage || "",
        avatar: profileData.avatar || admin.avatar || profileData.profileImage || admin.profileImage || "",
        // Profile fields
        contactNumber: profileData.contactNumber || admin.contactNumber || "",
        address: profileData.address || admin.address || "",
        role: profileData.role || admin.role || "admin",
      };

      console.log("✅ Google Login - Complete Admin Data:", completeAdmin);

      // ✅ Save to sessionStorage using helper
      setAdminData(completeAdmin);
      setAdminToken(data.token);
      sessionStorage.setItem("currentAdminId", completeAdmin._id);
      sessionStorage.setItem("userType", "admin");

      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Welcome to the admin panel!",
        timer: 1500,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/admin-settings"), 200);
    } catch (error) {
      console.error("Google Login Error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Google login failed. Please try again.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen bg-gray-300" id="BODY">
      {/* HEADER */}
      <header className="bg-indigo-950 text-white flex justify-between items-center px-10 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo_white.png" alt="Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">SDDMS</h1>
        </div>

        <nav className="flex gap-8 text-lg font-semibold">
          <a href="#" className="hover:text-indigo-300">ABOUT US</a>
          <a href="#" className="hover:text-indigo-300">CONTACT</a>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <div
        className="relative lg:min-h-screen w-full flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/BUKSU.jpg')" }}
      >
        <div className="absolute inset-0 bg-indigo-950/55"></div>

        {/* CARD */}
        <div className="relative z-10 bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 text-slate-600 hover:text-slate-900 transition flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-200"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Logo Circle with Briefcase Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-orange-600/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg">
            <Briefcase size={40} className="text-orange-600" strokeWidth={1.5} />
          </div>

          <h2 className="text-center text-xl font-bold text-slate-900 mb-6">
            ADMIN REGISTRATION
          </h2>

          {/* ROLE SWITCH */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <button 
              onClick={() => navigate("/donor-registration")}
              className="py-2.5 px-8 rounded-full text-sm font-bold shadow-md bg-blue-100 text-blue-700 hover:bg-indigo-900 hover:text-white transition"
            >
              DONOR
            </button>

            <button 
              onClick={() => setActiveTab("admin")}
              className="py-2.5 px-8 rounded-full text-sm font-bold shadow-md bg-orange-600 text-white hover:bg-orange-700 transition"
            >
              ADMINISTRATOR
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <input 
                type="text" 
                name="firstname" 
                placeholder="Firstname" 
                value={formData.firstname} 
                onChange={handleChange}
                className="w-1/2 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-slate-900 placeholder-slate-500" 
                required
                autoComplete="given-name"
              />

              <input 
                type="text" 
                name="lastname" 
                placeholder="Lastname" 
                value={formData.lastname} 
                onChange={handleChange}
                className="w-1/2 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-slate-900 placeholder-slate-500" 
                required
                autoComplete="family-name"
              />
            </div>

            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-slate-900 placeholder-slate-500" 
              required
              autoComplete="email"
            />

            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-slate-900 placeholder-slate-500" 
              required
              autoComplete="new-password"
            />

            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Confirm Password" 
              value={formData.confirmPassword} 
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-slate-900 placeholder-slate-500" 
              required
              autoComplete="new-password"
            />

            {/* reCAPTCHA */}
            <div className="flex justify-center py-2">
              <ReCAPTCHA 
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} 
                onChange={handleCaptchaChange}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 rounded-lg text-sm font-bold mt-4 hover:bg-orange-700 transition shadow-md"
            >
              CREATE ACCOUNT
            </button>

            {/* Google Login */}
            <div className="flex justify-center scale-90 origin-center -mx-3">
              <GoogleLogin 
                onSuccess={handleGoogleLogin} 
                onError={() => console.log("Google Login Failed 😢")}
              />
            </div>

            <div className="text-center mt-4">
              <a 
                onClick={() => navigate("/login-admin")}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer hover:underline"
              >
                Already have an account? Login
              </a>
            </div>
          </form>

          {message && (
            <p className={`text-center text-xs mt-2 ${
              message.includes("✅") ? "text-green-600 font-semibold" : 
              message.includes("⏳") ? "text-blue-600 font-semibold" : 
              "text-red-600 font-semibold"
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin_Registration;
