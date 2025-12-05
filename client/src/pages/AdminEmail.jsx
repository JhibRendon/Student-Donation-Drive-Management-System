import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminEmail = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    if (!captchaChecked) {
      alert("Please verify that you are not a robot.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Call backend to check if email exists & send code
      const response = await axios.post("http://localhost:5000/api/reset/send-code", {
        email,
        role: "admin", // tell backend this is for admin
      });

      if (response.data.success) {
        alert("✅ Verification code sent to your email!");
        // Navigate to digit input page, carrying the email
        navigate("/admin-digits", { state: { email } });
      } else {
        alert(response.data.message || "Something went wrong. Try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Server error. Try again later.");
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
          <a href="#" className="hover:text-indigo-300">
            ABOUT US
          </a>
          <a href="#" className="hover:text-indigo-300">
            CONTACT
          </a>
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
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 text-center mt-4">
            RESET ADMIN PASSWORD
          </h2>
          <p className="text-gray-600 text-center mt-2 text-sm">
            Enter your email for verification. We will send a 4-digit code to your email.
          </p>

          {/* Email Input */}
          <div className="mt-6">
            <label
              className="block text-gray-700 text-sm font-semibold mb-1"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="shadow border rounded-lg w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* CAPTCHA */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="recaptcha"
              className="mr-2"
              checked={captchaChecked}
              onChange={(e) => setCaptchaChecked(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="recaptcha" className="text-sm text-gray-700">
              I'm not a robot
            </label>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading}
            className={`${
              loading ? "bg-orange-300" : "bg-orange-400 hover:bg-orange-500"
            } text-white font-bold py-2.5 px-4 rounded-xl mt-6 w-full transition-colors`}
          >
            {loading ? "Sending..." : "SEND"}
          </button>

          {/* Login Link */}
          <div className="text-center mt-4 text-sm text-gray-700">
            <span>Remembered your password? </span>
            <button
              onClick={handleLogin}
              disabled={loading}
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

export default AdminEmail;
