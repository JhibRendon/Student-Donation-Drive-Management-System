import React from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import "../styles/SuperAdminLayout.css";

const SuperAdminLayout = ({ children }) => {
  return (
    <div className="superadmin-layout">
      <SuperAdminSidebar />
      <main className="superadmin-main-content">{children}</main>
    </div>
  );
};

export default SuperAdminLayout;
