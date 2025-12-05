import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import Swal from "sweetalert2";
import { 
  LayoutDashboard, Gift, Users, FileText, LogOut, Settings, 
  Activity, TrendingUp, Eye, Edit, CheckCircle, XCircle, Archive
} from "lucide-react";
import axios from "axios";
import { getAdminData, getAdminToken, clearAdminStorage } from "../utils/storageHelper.js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalDonors: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
  });
  const [campaignsOverTime, setCampaignsOverTime] = useState([]);
  const [donationsPerCategory, setDonationsPerCategory] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get admin data using helper
    const adminData = getAdminData();
    
    // Check if user is SuperAdmin - redirect them
    if (adminData) {
      // If SuperAdmin, redirect to SuperAdmin Dashboard
      if (adminData.role === "SuperAdmin") {
        console.log("🔐 SuperAdmin detected in AdminDashboard - Redirecting to SuperAdmin Dashboard");
        navigate("/super-admin-dashboard");
        return;
      }
      
      const firstName = adminData.name ? adminData.name.split(" ")[0] : "Admin";
      setAdmin({ ...adminData, firstName });
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      console.log("📡 Fetching dashboard stats from /api/admin/dashboard/stats...");
      const token = getAdminToken();
      console.log("🔐 Token available:", !!token);
      
      const response = await axios.get("http://localhost:5000/api/admin/dashboard/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      console.log("✅ Dashboard stats response:", response.data);
      
      if (response.data.success) {
        setStats(response.data.stats);
        
        // Format campaigns over time for chart
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formatted = response.data.campaignsOverTime.map(item => ({
          month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
          count: item.count,
        }));
        setCampaignsOverTime(formatted);

        // Format donations per category for pie chart
        const formattedCategories = response.data.donationsPerCategory.map(item => ({
          name: item._id || "Uncategorized",
          value: item.count,
        }));
        setDonationsPerCategory(formattedCategories);

        setRecentCampaigns(response.data.recentCampaigns || []);
        setRecentDonations(response.data.recentDonations || []);
      } else {
        console.warn("⚠️ Response not successful:", response.data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received. Request:", error.request);
      }
      // Show user-friendly error but don't crash the page
    } finally {
      setLoading(false);
    }
  };

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
        clearAdminStorage();
        navigate("/login-admin");
      }
    });
  };

  const handleSidebar = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Approved</span>;
      case "Pending":
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Pending</span>;
      case "Rejected":
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getDonationStatusBadge = (status) => {
    switch (status) {
      case "Received":
      case "Verified":
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Received</span>;
      case "Pending":
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Pending</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-60 bg-indigo-950 text-white flex flex-col py-6 fixed left-0 top-0 h-screen">
        <div className="flex flex-col items-center flex-1">
          <div className="text-center mb-6">
            <img src="/logo_white.png" alt="Logo" className="w-14 mx-auto mb-2" />
            <h1 className="text-sm font-medium leading-tight text-center">
              Student Donation Drive <br /> Management System
            </h1>
          </div>

          <div className="flex items-center justify-center bg-indigo-900 rounded-full px-3 py-2 mb-5 w-44">
            {admin?.profileImage ? (
              <img 
                src={admin.profileImage} 
                alt="Profile" 
                className="w-8 h-8 rounded-full mr-2 flex-shrink-0 object-cover border-2 border-white"
              />
            ) : (
              <div className="w-8 h-8 bg-white rounded-full mr-2 flex-shrink-0"></div>
            )}
            <span className="font-semibold text-sm text-center truncate justify-center">
              {admin?.firstName || admin?.name || "Admin"}
            </span>
          </div>

          <h2 className="text-lg font-bold mb-3 tracking-wide text-center">ADMIN</h2>
          <hr className="border-white/30 w-3/4 mb-5 mx-auto" />

          <nav className="w-full flex flex-col items-center space-y-1 flex-1">
            <SidebarBtn
              icon={<LayoutDashboard className="w-4 h-4" />}
              text="Dashboard"
              onClick={() => handleSidebar("/admin-dashboard")}
              active={isActive("/admin-dashboard")}
            />
            <SidebarBtn
              icon={<Gift className="w-4 h-4" />}
              text="Manage Campaigns"
              onClick={() => handleSidebar("/manage-campaigns")}
              active={isActive("/manage-campaigns")}
            />
            <SidebarBtn
              icon={<Archive className="w-4 h-4" />}
              text="Archive"
              onClick={() => handleSidebar("/archive")}
              active={isActive("/archive")}
            />
            <SidebarBtn
              icon={<FileText className="w-4 h-4" />}
              text="Reports"
              onClick={() => handleSidebar("/reports")}
              active={isActive("/reports")}
            />
            <SidebarBtn
              icon={<Gift className="w-4 h-4" />}
              text="Past Donations"
              onClick={() => handleSidebar("/admin-past-donations")}
              active={isActive("/admin-past-donations")}
            />
            <SidebarBtn
              icon={<Users className="w-4 h-4" />}
              text="Manage Donors"
              onClick={() => handleSidebar("/manage-donors")}
              active={isActive("/manage-donors")}
            />
            <SidebarBtn
              icon={<Activity className="w-4 h-4" />}
              text="Activity Logs"
              onClick={() => handleSidebar("/activity-logs")}
              active={isActive("/activity-logs")}
            />
            <SidebarBtn
              icon={<Settings className="w-4 h-4" />}
              text="Settings"
              onClick={() => handleSidebar("/admin-settings")}
              active={isActive("/admin-settings")}
            />
          </nav>
        </div>

  {/* Logout Button (always visible) */}
  <div className="border-t border-indigo-900 pt-4 px-4">
    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-900 transition flex items-center gap-3 text-red-400 hover:text-red-300"
    >
      <LogOut size={20} />
      Logout
    </button>
  </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 ml-60 ">
        <header className="flex justify-between items-center border-b-2 border-indigo-950 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-indigo-600">{admin?.firstName || admin?.name || "Admin"}</span>
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-950 text-white rounded-lg hover:bg-indigo-900 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Activity className="w-5 h-5" />
            <span className="font-semibold">Refresh</span>
          </button>
        </header>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Campaigns"
                value={stats.totalCampaigns}
                icon={<FileText className="w-8 h-8" />}
                color="blue"
              />
              <MetricCard
                title="Total Donors"
                value={stats.totalDonors}
                icon={<Users className="w-8 h-8" />}
                color="green"
              />
              <MetricCard
                title="Active Campaigns"
                value={stats.activeCampaigns}
                icon={<TrendingUp className="w-8 h-8" />}
                color="orange"
              />
              <MetricCard
                title="Pending Campaigns"
                value={stats.pendingCampaigns}
                icon={<Activity className="w-8 h-8" />}
                color="purple"
              />
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Campaigns Over Time */}
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-950">Campaigns Over Time</h2>
                    <p className="text-sm text-gray-500 mt-1">Monthly campaign submissions</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#f3f4f6', border: '2px solid #2563eb', borderRadius: '8px' }}
                      cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donations per Category */}
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg transition">
                <div>
                  <h2 className="text-xl font-bold text-indigo-950 mb-1">Donations per Category</h2>
                  <p className="text-sm text-gray-500 mb-6">Distribution across all categories</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={donationsPerCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {donationsPerCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#f3f4f6', border: '2px solid #2563eb', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABLES */}
            <div className="grid grid-cols-1 gap-6">
              {/* Campaign Status Overview */}
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-950">Campaign Status Overview</h2>
                    <p className="text-sm text-gray-500 mt-1">Recent campaign submissions and their status</p>
                  </div>
                  <button className="bg-indigo-950 hover:bg-indigo-900 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition">
                    View More
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-indigo-50 border-b-2 border-indigo-200">
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Name</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Campaign Name</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Categories</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Donation Type</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Date Submitted</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCampaigns.slice(0, 5).map((campaign) => (
                        <tr key={campaign._id} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-200">
                          <td className="py-4 px-4 font-medium text-gray-800">{campaign.beneficiaryName || "N/A"}</td>
                          <td className="py-4 px-4 font-semibold text-indigo-900">{campaign.title}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {campaign.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              {campaign.donationType}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {new Date(campaign.createdAt).toISOString().split("T")[0]}
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(campaign.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Donations */}
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-950">Recent Donations</h2>
                    <p className="text-sm text-gray-500 mt-1">Latest contributions from donors</p>
                  </div>
                  <button className="bg-indigo-950 hover:bg-indigo-900 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition">
                    View More
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-indigo-50 border-b-2 border-indigo-200">
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Donor Name</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Campaign Name</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Category</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Amount/Item</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Date Donated</th>
                        <th className="text-left py-4 px-4 font-bold text-indigo-950">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDonations.slice(0, 5).map((donation) => (
                        <tr key={donation._id} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-200">
                          <td className="py-4 px-4 font-medium text-gray-800">{donation.donor?.name || "N/A"}</td>
                          <td className="py-4 px-4 font-semibold text-indigo-900">
                            {donation.driveId?.title || "N/A"}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                              {donation.driveId?.category || "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-green-700">
                            {donation.type?.toLowerCase().includes("cash")
                              ? `₱${Number(donation.cashAmount || 0).toLocaleString()}`
                              : donation.goodsDescription || "Goods"}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {new Date(donation.createdAt).toLocaleString('en-PH')}
                          </td>
                          <td className="py-4 px-4">
                            {getDonationStatusBadge("Verified")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const SidebarBtn = ({ icon, text, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md w-48 font-medium text-sm transition ${
      active ? "bg-gray-700" : "hover:bg-gray-700/60"
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

const MetricCard = ({ title, value, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    green: "bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-700",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-700",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-700",
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]} text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
