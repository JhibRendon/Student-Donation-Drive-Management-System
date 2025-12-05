import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ActivitySquare,
  Settings,
  BarChart3,
  Shield,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { clearSuperAdminStorage, clearAdminStorage } from "../utils/storageHelper.js";
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import "../styles/SuperAdminSidebar.css";

const SuperAdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/super-admin-dashboard",
      description: "Overview & Statistics",
    },
    {
      label: "Admin Management",
      icon: Shield,
      path: "/super-admin-rbac",
      description: "Create & Delete admins",
    },
    {
      label: "Manage Roles",
      icon: Users,
      path: "/manage-admin-roles",
      description: "Edit roles, permissions & access level",
    },
    {
      label: "Activity Logs",
      icon: ActivitySquare,
      path: "/super-admin-activity-logs",
      description: "View system activities",
    },
    {
      label: "Reports",
      icon: BarChart3,
      path: "/super-admin-reports",
      description: "View analytics & reports",
    },
  ];

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        clearSuperAdminStorage();
        clearAdminStorage();
        navigate("/login-admin");
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`superadmin-sidebar ${isOpen ? "expanded" : "collapsed"} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Shield className="h-8 w-8 text-indigo-600" />
            {isOpen && <h2>SuperAdmin</h2>}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileOpen(false);
                }}
                className={`nav-item ${active ? "active" : ""}`}
                title={item.label}
              >
                <div className="nav-item-content">
                  <Icon className="h-5 w-5" />
                  {isOpen && (
                    <div className="nav-item-text">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </div>
                {active && <div className="active-indicator"></div>}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="sidebar-divider"></div>

        {/* Profile & Logout */}
        <div className="sidebar-footer">
          <button
            onClick={() => {
              navigate("/admin-settings");
              setIsMobileOpen(false);
            }}
            className={`footer-item ${isActive("/admin-settings") ? "active" : ""}`}
            title="My Profile"
          >
            <User className="h-5 w-5" />
            {isOpen && <span>My Profile</span>}
          </button>
          <button
            onClick={handleLogout}
            className="footer-item logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sidebar-toggle"
          title={isOpen ? "Collapse" : "Expand"}
        >
          {isOpen ? "◄" : "►"}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default SuperAdminSidebar;
