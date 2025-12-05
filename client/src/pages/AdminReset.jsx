import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const AdminReset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || ""; // ✅ Passed from AdminDigits.jsx

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

 const handleReset = async () => {
  if (!password || !confirmPassword) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill out both password fields.",
    });
    return;
  }

  if (password !== confirmPassword) {
    Swal.fire({
      icon: "warning",
      title: "Passwords Don't Match",
      text: "Passwords do not match. Please try again.",
    });
    return;
  }

  setLoading(true);
  try {
    const response = await axios.post("http://localhost:5000/api/reset/reset-password", {
      email,
      role: "admin",
      newPassword: password,
    });

    if (response.data.success) {
      Swal.fire({
        icon: "success",
        title: "Password Reset!",
        text: "Your password has been reset successfully. Redirecting to login...",
        timer: 1500,
      });
      navigate("/login-admin");
    } else {
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: response.data.message || "Failed to reset password.",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.response?.data?.message || "Server error. Please try again.",
    });
  } finally {
    setLoading(false);
  }
};


  const handleLogin = () => {
    navigate("/login-admin");
  };

  return (
    <div className="p-0 m-0 min-h-screen bg-gray-300" id="BODY">
      {/* HEADER */}
      <header className="bg-indigo-950 text-white flex justify-between items-center px-8 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo_white.png" alt="Logo" className="w-9 h-9" />
          <h1 className="text-xl font-bold">SDDMS</h1>
        </div>
        <nav className="flex gap-6 text-sm font-semibold">
          <a href="#" className="hover:text-indigo-300">ABOUT US</a>
          <a href="#" className="hover:text-indigo-300">CONTACT</a>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <div
        className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/BUKSU.jpg')" }}
      >
        <div className="absolute inset-0 bg-indigo-950/55"></div>

        <div className="relative bg-white rounded-2xl shadow-xl p-8 w-[25rem] min-h-[28rem] z-10">
          {/* ICON */}
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-100 p-3 text-orange-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2-2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 text-center mt-4">
            Reset Admin Password
          </h2>
          <p className="text-gray-600 text-center mt-2 text-sm">
            Set a new password for your account
          </p>

          {/* PASSWORD INPUTS */}
          <div className="mt-6">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="shadow border rounded-lg w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              className="shadow border rounded-lg w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* RESET BUTTON */}
          <button
            onClick={handleReset}
            disabled={loading}
            className={`${
              loading ? "bg-orange-300" : "bg-orange-400 hover:bg-orange-500"
            } text-white font-bold py-2.5 px-4 rounded-xl mt-6 w-full transition-colors`}
          >
            {loading ? "UPDATING..." : "RESET PASSWORD"}
          </button>

          {/* LOGIN LINK */}
          <div className="text-center mt-4 text-sm text-gray-700">
            <span>Remembered your password? </span>
            <button
              onClick={handleLogin}
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReset;
