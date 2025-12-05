// routes/manualAuthRoute.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import Donor from "../models/Donor.js";

dotenv.config();
const router = express.Router();

// =============================
// 🔹 MANUAL REGISTER
// =============================
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, userType } = req.body;

    // Validate inputs
    if (!name || !email || !password || !userType) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    // Normalize inputs
    name = name.trim();
    email = email.trim().toLowerCase();

    // Determine the correct model
    const Model = userType === "admin" ? Admin : Donor;

    // Check if user already exists
    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new Model({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${userType} registered successfully.`,
      data: {
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
      },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration." });
  }
});

// =============================
// 🔹 MANUAL LOGIN
// =============================
router.post("/login", async (req, res) => {
  try {
    let { email, password, userType } = req.body;

    // Validate inputs
    if (!email || !password || !userType) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    const Model = userType === "admin" ? Admin : Donor;

    // Find user by email
    const user = await Model.findOne({ email });
    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    console.log(`Found ${userType} for email: ${email}`);
    if (userType === "donor") {
      console.log(`   Name: ${user.name}, Contact: ${user.contactNumber}, Address: ${user.address}`);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password." });
    }

    // Create a secure JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: userType },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // For donors, return complete profile data (like Google login does)
    if (userType === "donor") {
      return res.json({
        success: true,
        message: `${userType} login successful.`,
        data: {
          token,
          donor: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage || user.avatar || "",
            avatar: user.avatar || "",
            contactNumber: user.contactNumber || "",
            address: user.address || "",
            gender: user.gender || "",
            birthday: user.birthday || "",
            createdAt: user.createdAt,
          },
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage || user.avatar || "",
            avatar: user.avatar || "",
            contactNumber: user.contactNumber || "",
            address: user.address || "",
            gender: user.gender || "",
            birthday: user.birthday || "",
            createdAt: user.createdAt,
          },
        },
      });
    }

    // For admins, return minimal data
    res.json({
      success: true,
      message: `${userType} login successful.`,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userType,
        },
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
  
});

export default router;
