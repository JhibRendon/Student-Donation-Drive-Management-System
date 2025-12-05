import Admin, { ADMIN_ROLES, PERMISSIONS } from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";

/**
 * Middleware to check if admin has required role
 * Usage: router.post('/endpoint', authMiddleware, authorize(ADMIN_ROLES.SUPER_ADMIN), controller)
 */
export const authorize = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Check SuperAdmin collection first
      let admin = await SuperAdmin.findById(req.admin.id);
      
      // If not in SuperAdmin collection, check Admin collection
      if (!admin) {
        admin = await Admin.findById(req.admin.id);
      }

      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      // SuperAdmin can access everything
      if (admin.role === ADMIN_ROLES.SUPER_ADMIN) {
        return next();
      }

      // Check if admin has the required role
      if (admin.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${requiredRole}`,
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

/**
 * Middleware to check if admin has specific permission
 * Usage: router.post('/endpoint', authMiddleware, hasPermission(PERMISSIONS.APPROVE_CAMPAIGN), controller)
 */
export const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Check SuperAdmin collection first
      let admin = await SuperAdmin.findById(req.admin.id);
      
      // If not in SuperAdmin collection, check Admin collection
      if (!admin) {
        admin = await Admin.findById(req.admin.id);
      }

      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      // SuperAdmin has all permissions
      if (admin.role === ADMIN_ROLES.SUPER_ADMIN) {
        return next();
      }

      // Check if admin has the required permission
      if (!admin.permissions || !admin.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required permission: ${requiredPermission}`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

/**
 * Middleware to check if admin has multiple permissions (ANY)
 * Usage: router.post('/endpoint', authMiddleware, hasAnyPermission([PERMISSIONS.APPROVE_CAMPAIGN, PERMISSIONS.REJECT_CAMPAIGN]), controller)
 */
export const hasAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Check SuperAdmin collection first
      let admin = await SuperAdmin.findById(req.admin.id);
      
      // If not in SuperAdmin collection, check Admin collection
      if (!admin) {
        admin = await Admin.findById(req.admin.id);
      }

      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      // SuperAdmin has all permissions
      if (admin.role === ADMIN_ROLES.SUPER_ADMIN) {
        return next();
      }

      // Check if admin has any of the required permissions
      const hasAny = requiredPermissions.some((perm) =>
        admin.permissions && admin.permissions.includes(perm)
      );

      if (!hasAny) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

/**
 * Middleware to check if admin has multiple permissions (ALL)
 * Usage: router.post('/endpoint', authMiddleware, hasAllPermissions([PERMISSIONS.APPROVE_CAMPAIGN, PERMISSIONS.VIEW_CAMPAIGNS]), controller)
 */
export const hasAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Check SuperAdmin collection first
      let admin = await SuperAdmin.findById(req.admin.id);
      
      // If not in SuperAdmin collection, check Admin collection
      if (!admin) {
        admin = await Admin.findById(req.admin.id);
      }

      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      // SuperAdmin has all permissions
      if (admin.role === ADMIN_ROLES.SUPER_ADMIN) {
        return next();
      }

      // Check if admin has all required permissions
      const hasAll = requiredPermissions.every((perm) =>
        admin.permissions && admin.permissions.includes(perm)
      );

      if (!hasAll) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

/**
 * Middleware to ensure only SuperAdmin can perform action
 * Usage: router.post('/endpoint', authMiddleware, onlySuperAdmin, controller)
 */
export const onlySuperAdmin = async (req, res, next) => {
  try {
    console.log("\n========== 🔐 SUPER ADMIN AUTHORIZATION CHECK ==========");
    console.log("Request path:", req.path);
    console.log("req.admin object:", req.admin);
    console.log("req.user object:", req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : "None");
    
    if (!req.admin || !req.admin.id) {
      console.log("❌ FAIL: No admin object or id found");
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    console.log(`Checking user with ID: ${req.admin.id}`);

    // Check SuperAdmin collection first
    let admin = await SuperAdmin.findById(req.admin.id);
    if (admin) {
      console.log(`✅ Found in SuperAdmin collection: ${admin.email}, role: ${admin.role}`);
    } else {
      console.log(`❌ Not found in SuperAdmin collection`);
      
      // If not in SuperAdmin collection, check Admin collection
      admin = await Admin.findById(req.admin.id);
      if (admin) {
        console.log(`✅ Found in Admin collection: ${admin.email}, role: ${admin.role}`);
      } else {
        console.log(`❌ Not found in Admin collection either`);
      }
    }

    if (!admin) {
      console.log("❌ FAIL: Admin/SuperAdmin not found in database");
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Check if user is SuperAdmin
    const isSuperAdmin = admin.role === ADMIN_ROLES.SUPER_ADMIN || admin.role === "SuperAdmin";
    console.log(`Role check: admin.role="${admin.role}" vs ADMIN_ROLES.SUPER_ADMIN="${ADMIN_ROLES.SUPER_ADMIN}" => isSuperAdmin=${isSuperAdmin}`);
    
    if (!isSuperAdmin) {
      console.log(`❌ FAIL: User role "${admin.role}" is not SuperAdmin`);
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin can perform this action",
      });
    }

    console.log("✅ PASS: SuperAdmin authorization granted");
    console.log("========== END CHECK ==========\n");
    next();
  } catch (error) {
    console.error("❌ ERROR in SuperAdmin check:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
