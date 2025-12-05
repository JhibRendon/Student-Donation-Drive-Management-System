import express from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import Donor from "../models/Donor.js";

dotenv.config();

const router = express.Router();

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send 4-digit code
router.post("/send-code", async (req, res) => {
  const { email, role } = req.body; // role = 'admin' or 'donor'
  const Model = role === "admin" ? Admin : Donor;

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetCode = code;
    user.resetCodeExpire = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code",
      text: `Your reset code is ${code}. It expires in 5 minutes.`,
    });

    res.json({ success: true, message: "Reset code sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify code
router.post("/verify-code", async (req, res) => {
  const { email, role, code } = req.body;
  const Model = role === "admin" ? Admin : Donor;

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetCode !== code || Date.now() > user.resetCodeExpire) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.json({ success: true, message: "Code verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, role, newPassword } = req.body;
  const Model = role === "admin" ? Admin : Donor;

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetCode = null;
    user.resetCodeExpire = null;
    await user.save();

    res.json({ success: true, message: "Password has been updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
