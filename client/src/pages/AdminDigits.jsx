import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const AdminDigits = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || ""; // ✅ passed from AdminEmail.jsx

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newDigits = [...digits];
      newDigits[index] = value;
      setDigits(newDigits);

      // Auto focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== 4) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Code",
        text: "Please enter the 4-digit code.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/reset/verify-code", {
        email,
        role: "admin",
        code,
      });

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Code Verified!",
          text: "Redirecting to reset password...",
          timer: 1500,
        });
        navigate("/admin-reset", { state: { email } }); // ✅ pass email to reset page
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid Code",
          text: response.data.message || "Invalid code.",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error.response?.data?.message || "Server error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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
        {/* Overlay */}
        <div className="absolute inset-0 bg-indigo-950/55"></div>

        {/* CARD */}
        <div className="relative bg-white rounded-2xl shadow-xl p-8 w-[25rem] min-h-[28rem] z-10 border-l-[10px] border-orange-400">
          {/* Shield Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-100 p-3 text-orange-600">
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
            RESET ADMIN PASSWORD
          </h2>
          <p className="text-gray-600 text-center mt-2 text-sm">
            Enter the 4-digit code that you received on your email.
          </p>

          {/* Code Inputs */}
          <div className="mt-6 flex justify-center space-x-4">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`digit-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-14 h-14 border-2 border-orange-400 rounded-lg text-center text-2xl font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading}
            className={`${
              loading ? "bg-orange-300" : "bg-orange-400 hover:bg-orange-500"
            } text-white font-bold py-2 px-4 rounded-xl mt-6 w-full transition-colors`}
          >
            {loading ? "VERIFYING..." : "CONTINUE"}
          </button>

          {/* Login Link */}
          <div className="text-center mt-4 text-sm text-gray-700">
            <span>Remembered your password? </span>
            <button
              onClick={() => navigate("/login-admin")}
              className="text-orange-600 hover:text-orange-800 font-semibold"
            >
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDigits;
