/**
 * ============================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================
 * 
 * This middleware verifies JWT tokens and authenticates users.
 * It extracts the token from the Authorization header, verifies it,
 * and attaches the user object to the request.
 * 
 * Usage:
 * - Protect routes by adding this middleware
 * - Access authenticated user via req.user
 */

import jwt from "jsonwebtoken";
import Donor from "../models/Donor.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    console.log("🔍 Auth header received:", authHeader ? "✓ Present" : "✗ Missing");
    
    if (!authHeader) {
      console.log("❌ No Authorization header provided");
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(" ");
    console.log("🔍 Authorization header parts:", parts.length, "Expected: 2");
    
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("❌ Invalid authorization format:", parts[0], "Token length:", parts[1]?.length || 0);
      return res.status(401).json({ message: "Invalid token format. Expected 'Bearer <token>'" });
    }

    const token = parts[1];
    console.log("🔐 Token received - Length:", token.length, "First 20 chars:", token.substring(0, 20) + "...");

    // Check if token is empty or undefined
    if (!token || token.trim() === "") {
      console.log("❌ Token is empty or whitespace");
      return res.status(401).json({ message: "Empty token" });
    }

    // Verify token using JWT secret
    console.log("🔑 JWT_SECRET available:", process.env.JWT_SECRET ? "✓ Yes" : "✗ No");
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified successfully - Role:", decoded.role);
    } catch (jwtErr) {
      console.error("❌ JWT verification failed:", jwtErr.message);
      console.error("   Error type:", jwtErr.name);
      return res.status(401).json({ 
        message: "Invalid token: " + jwtErr.message,
        details: jwtErr.name
      });
    }

    console.log("🔐 Token decoded:", { id: decoded.id, role: decoded.role });

    // Find user based on role in token
    let user = null;
    
    if (decoded.role === "SuperAdmin") {
      console.log("👤 Looking up SuperAdmin with ID:", decoded.id);
      // SuperAdmin is stored in SuperAdmin collection
      user = await SuperAdmin.findById(decoded.id);
      if (!user) {
        console.log("❌ SuperAdmin not found with ID:", decoded.id);
        return res.status(401).json({ message: "SuperAdmin not found" });
      }
      console.log("✅ SuperAdmin found:", user.email);
    } else if (decoded.role === "admin") {
      console.log("👤 Looking up admin with ID:", decoded.id);
      user = await Admin.findById(decoded.id);
      if (!user) {
        console.log("❌ Admin not found with ID:", decoded.id);
        return res.status(401).json({ message: "Admin not found" });
      }
      console.log("✅ Admin found:", user.email);
    } else if (decoded.role === "donor") {
      console.log("👤 Looking up donor with ID:", decoded.id);
      user = await Donor.findById(decoded.id);
      if (!user) {
        console.log("❌ Donor not found with ID:", decoded.id);
        return res.status(401).json({ message: "Donor not found" });
      }
      console.log("✅ Donor found:", user.email);
    } else {
      console.log("❌ Invalid token role:", decoded.role);
      return res.status(401).json({ message: "Invalid token role" });
    }

    // Attach user object to request for use in route handlers
    req.user = user;
    console.log(`\n✅ Auth SUCCESS: User logged in as ${decoded.role}: ${user.email}`);
    
    // Also attach admin object if admin/superadmin is authenticated (for RBAC middleware)
    if (decoded.role === "admin" || decoded.role === "SuperAdmin") {
      req.admin = {
        id: user._id,
        role: user.role || decoded.role, // Use database role, fallback to token role
        permissions: user.permissions,
      };
      console.log(`📋 Set req.admin: { id: ${user._id}, role: "${req.admin.role}", permissions: ${user.permissions?.length || 0} items }\n`);
    }
    
    next();
  } catch (err) {
    console.error("❌ Unexpected auth middleware error:", err.message);
    console.error("   Full error:", err);
    res.status(401).json({ message: "Unauthorized: " + err.message });
  }
};

export default authMiddleware;

