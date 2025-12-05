/**
 * ============================================
 * MAIN APPLICATION COMPONENT
 * ============================================
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SuperAdminRoute, AdminRoute } from "./components/ProtectedRoute";
import { useAuthSync } from "./hooks/useAuthSync";

// ============================================
// PUBLIC PAGES
// ============================================
import LandingPage from "./pages/LandingPage";
import DonorLogin from "./pages/DonorLogin";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import DonorRegistration from "./pages/Donor_Registration";
import Admin_Registration from "./pages/Admin_Registration";
import DonorReset from "./pages/DonorReset";
import AdminReset from "./pages/AdminReset";
import DonorEmail from "./pages/DonorEmail";
import AdminEmail from "./pages/AdminEmail";
import DonorDigits from "./pages/DonorDigits";
import AdminDigits from "./pages/AdminDigits";
import LOGINADMIN from "./pages/LOGINADMIN";
import ExplorePage from "./pages/ExplorePage";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import LearnMorePage from "./pages/LearnMorePage";

// ============================================
// DONOR PAGES
// ============================================
import DonorDashboard from "./pages/DonorDashboard";
import DonationCamp from "./pages/DonationCamp";
import Mydonation from "./pages/Mydonations";
import CreateCamp from "./pages/CreateCamp";
import DonateNow from "./pages/DonateNow";
import DonorSettings from "./pages/DonorSettings";

// ============================================
// ADMIN PAGES
// ============================================
import AdminDashboard from "./pages/AdminDashboard";
import ManageCampaigns from "./pages/ManageCampaigns";
import ManageCategories from "./pages/ManageCategories";
import ManageDonors from "./pages/ManageDonors";
import AdminProfile from "./pages/AdminProfile";
import AdminSettings from "./pages/AdminSettings";
import ArchivePage from "./pages/ArchivePage";
import AdminPastDonations from "./pages/AdminPastDonations";
import Report from "./pages/Report";
import ActivityLogs from "./pages/ActivityLogs";

// ============================================
// SUPERADMIN PAGES
// ============================================
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminRBACManagement from "./pages/SuperAdminRBACManagement";
import ManageAdminRoles from "./pages/ManageAdminRoles";
import SuperAdminActivityLogs from "./pages/SuperAdminActivityLogs";
import SuperAdminReports from "./pages/SuperAdminReports";

/**
 * Main App Component
 * Handles all routing for the application
 */
function App() {
  // Note: useAuthSync is disabled to allow multiple independent tabs with different users
  // Each tab maintains its own session independently
  // useAuthSync();

  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            PUBLIC ROUTES
            ============================================ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/create-campaign" element={<CreateCampaignPage />} />
        <Route path="/learn-more" element={<LearnMorePage />} />
        
        {/* Authentication Routes */}
        <Route path="/donor-login" element={<DonorLogin />} />
        <Route path="/login-admin" element={<AdminLogin />} />
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route path="/loginadmin" element={<LOGINADMIN />} />
        
        {/* Registration Routes */}
        <Route path="/donor-registration" element={<DonorRegistration />} />
        <Route path="/admin-registration" element={<Admin_Registration />} />
        
        {/* Password Reset Routes */}
        <Route path="/donor-reset" element={<DonorReset />} />
        <Route path="/admin-reset" element={<AdminReset />} />
        <Route path="/donor-email" element={<DonorEmail />} />
        <Route path="/admin-email" element={<AdminEmail />} />
        <Route path="/donor-digits" element={<DonorDigits />} />
        <Route path="/admin-digits" element={<AdminDigits />} />

        {/* ============================================
            DONOR ROUTES
            ============================================ */}
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/donation-camp" element={<DonationCamp />} />
        <Route path="/my-donations" element={<Mydonation />} />
        <Route path="/create-camp" element={<CreateCamp />} />
        <Route path="/donor/donate-now/:driveId" element={<DonateNow />} />
        <Route path="/donor-settings" element={<DonorSettings />} />

        {/* ============================================
            ADMIN ROUTES
            ============================================ */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manage-campaigns" element={<ManageCampaigns />} />
        <Route path="/manage-categories" element={<ManageCategories />} />
        <Route path="/manage-donors" element={<ManageDonors />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/admin-past-donations" element={<AdminPastDonations />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />

        {/* ============================================
            SUPERADMIN ROUTES (5 Core Routes)
            ============================================ */}
        <Route path="/super-admin-dashboard" element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        } />
        <Route path="/super-admin-rbac" element={
          <SuperAdminRoute>
            <SuperAdminRBACManagement />
          </SuperAdminRoute>
        } />
        <Route path="/manage-admin-roles" element={
          <SuperAdminRoute>
            <ManageAdminRoles />
          </SuperAdminRoute>
        } />
        <Route path="/super-admin-activity-logs" element={
          <SuperAdminRoute>
            <SuperAdminActivityLogs />
          </SuperAdminRoute>
        } />
        <Route path="/super-admin-reports" element={
          <SuperAdminRoute>
            <SuperAdminReports />
          </SuperAdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
