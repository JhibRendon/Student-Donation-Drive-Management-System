/**
 * ============================================
 * SERVER APPLICATION ENTRY POINT
 * ============================================
 * 
 * This file initializes the Express server, configures middleware,
 * sets up routes, and connects to MongoDB.
 * 
 * Structure:
 * - Express app configuration
 * - Middleware setup (CORS, JSON parsing, sessions)
 * - Route registration
 * - Database connection
 * - Server startup
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";

// Import middleware
import authMiddleware from "./middleware/auth.js";
import { concurrencyControl } from "./middleware/concurrencyControl.js";

// Import routes
import campaignRoutes from "./routes/campaignRoute.js";
import donorRoutes from "./routes/donorRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import superAdminRoutes from "./routes/superAdminRoute.js";
import roleManagementRoutes from "./routes/roleManagementRoute.js";

// Import models for data normalization
import Admin, { ADMIN_ROLES } from "./models/Admin.js";
import googleAuthRoute from "./routes/googleAuthRoute.js";
import manualAuthRoute from "./routes/manualAuthRoute.js";
import resetRoute from "./routes/resetRoute.js";
import notificationRoute from "./routes/notificationRoute.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

/**
 * CORS Configuration
 * Allows cross-origin requests from the React frontend
 */
app.use(
  cors({
    origin: ["http://localhost:5173"], // Vite port
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies/credentials
  })
);

/**
 * Security Headers Middleware
 * Configures Cross-Origin-Opener-Policy to allow OAuth popups in multiple tabs
 * This prevents "Cross-Origin-Opener-Policy policy would block the window.postMessage call" errors
 */
app.use((req, res, next) => {
  // Allow cross-origin opener policy for OAuth popups and multiple tabs
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Ensure CORS headers are properly set for all responses
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin === 'http://localhost:5173') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  
  next();
});

/**
 * Body Parser Middleware
 * Parse JSON and URL-encoded request bodies
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CONCURRENCY CONTROL MIDDLEWARE
 * Prevents duplicate requests from reaching the backend (double-click protection)
 * Applies to all POST, PUT, DELETE requests
 */
app.use(concurrencyControl);

/**
 * Session Middleware
 * Manages user sessions for authentication
 */
if (!process.env.SESSION_SECRET) {
  console.error("❌ FATAL ERROR: SESSION_SECRET not set in .env file");
  process.exit(1);
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ============================================
// ROUTE REGISTRATION
// ============================================

/**
 * API Routes
 * All backend endpoints are prefixed with /api
 */
app.use("/api/donor", donorRoutes);        // Donor-related routes
app.use("/api/admin", adminRoutes);       // Admin-related routes (RBAC: Create/Delete)
app.use("/api/admin/manage-roles", roleManagementRoutes); // Role Management routes (Edit with MVCC)
app.use("/api/superadmin", superAdminRoutes); // SuperAdmin-related routes
app.use("/api/auth", googleAuthRoute);    // Google OAuth routes
app.use("/api/manual-auth", manualAuthRoute); // Manual authentication routes
app.use("/api/reset", resetRoute);        // Password reset routes
app.use("/api/donor", campaignRoutes);    // Campaign routes (donor access)
app.use("/api/notifications", notificationRoute); // Donor notifications

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * Root endpoint - Server health check
 */
app.get("/", (req, res) => {
  res.send("Backend running!");
});

// ============================================
// DATABASE CONNECTION
// ============================================

/**
 * MongoDB Connection
 * Connects to MongoDB using the connection string from environment variables
 */
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected successfully");
    
    // Normalize admin roles in database (fix lowercase 'admin' -> 'Admin')
    try {
      const result = await Admin.updateMany(
        { role: { $regex: "^admin$", $options: "i" } }, // Match 'admin', 'Admin', 'ADMIN', etc (case-insensitive)
        { $set: { role: "Admin" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Normalized ${result.modifiedCount} admins with lowercase role to 'Admin'`);
      }
      
      const superResult = await Admin.updateMany(
        { role: { $regex: "^superadmin$", $options: "i" } },
        { $set: { role: "SuperAdmin" } }
      );
      if (superResult.modifiedCount > 0) {
        console.log(`Normalized ${superResult.modifiedCount} superadmins with incorrect case to 'SuperAdmin'`);
      }
    } catch (normErr) {
      console.warn("Could not normalize admin roles:", normErr.message);
    }
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    console.error("Connection String:", process.env.MONGODB_URL);
    console.error("\nTroubleshooting tips:");
    console.error("1. Check if your IP is whitelisted in MongoDB Atlas Network Access");
    console.error("2. Verify username and password are correct");
    console.error("3. Ensure database name is in the connection string");
    process.exit(1); // Exit if can't connect to DB
  });

// ============================================
// SERVER STARTUP
// ============================================

/**
 * Start the server
 * Listens on the port specified in environment variables or defaults to 5000
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

// Export app for testing purposes
export default app;

