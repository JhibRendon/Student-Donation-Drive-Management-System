import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Gift, Users, FileText, LogOut, Settings, 
  Activity, Download, Calendar, Filter, Archive
} from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import { getAdminData, getAdminToken, clearAdminStorage } from "../utils/storageHelper.js";

const ActivityLogs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    userType: "",
    resourceType: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const adminData = getAdminData();
    if (adminData) {
      try {
        const firstName = adminData.name ? adminData.name.split(" ")[0] : "Admin";
        setAdmin({ ...adminData, firstName });
      } catch (err) {
        console.error("Error parsing admin:", err);
      }
    }
    setCurrentPage(1);
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.userType) params.userType = filters.userType;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const token = getAdminToken();
      const response = await axios.get("http://localhost:5000/api/admin/activity-logs", { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch activity logs",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setTextColor(55, 48, 163);
      doc.text("Activity Logs Report", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Generated on: ${date}`, pageWidth / 2, 28, { align: "center" });

      const tableData = logs.map((log) => [
        new Date(log.createdAt).toLocaleString(),
        log.userName,
        log.userType,
        log.action,
        log.resourceType,
        log.details || "—"
      ]);

      doc.autoTable({
        head: [["Timestamp", "User", "Type", "Action", "Resource", "Details"]],
        body: tableData,
        startY: 35,
        styles: {
          fontSize: 9,
          cellPadding: 5,
          textColor: [55, 65, 81],
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { top: 35, right: 10, bottom: 15, left: 10 },
        columnStyles: {
          0: { cellWidth: 35 },
          2: { halign: "center" },
          4: { halign: "center" },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(`Total Logs: ${logs.length}`, 10, finalY);

      const fileName = `activity_logs_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Failed to export PDF. Please try again.",
      });
    }
  };

  const getActionColor = (action) => {
    if (action.includes("Created")) return "bg-green-100 text-green-700";
    if (action.includes("Updated")) return "bg-blue-100 text-blue-700";
    if (action.includes("Deleted")) return "bg-red-100 text-red-700";
    if (action.includes("Approved")) return "bg-green-100 text-green-700";
    if (action.includes("Rejected")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleSidebar = (path) => navigate(path);
  const isActive = (path) => location.pathname === path;

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
        <div className="flex flex-col items-center bg-indigo-950 pt-4 pb-6 border-t border-indigo-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-lg shadow-sm transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 ml-60">
        <header className="flex justify-between items-center border-b-2 border-indigo-950 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950">📋 Activity Logs</h1>
            <p className="text-gray-500 text-sm mt-1">
              Monitor all admin activities and system events <span className="text-indigo-950 font-semibold">({logs.length} total)</span>
            </p>
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </header>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Filter className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-800">Filter Activities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User Type</label>
              <select
                value={filters.userType}
                onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="">All Users</option>
                <option value="admin">Admin</option>
                <option value="donor">Donor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Type</label>
              <select
                value={filters.resourceType}
                onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="">All Resources</option>
                <option value="campaign">Campaign</option>
                <option value="donation">Donation</option>
                <option value="donor">Donor</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* LOGS CARDS */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-500 font-medium">Loading activity logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No activity logs found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Recent Activities <span className="text-indigo-950 font-semibold">({logs.length})</span>
                </h2>
                <span className="text-sm text-gray-600 font-medium">
                  Showing <span className="text-indigo-950 font-bold">{startIndex + 1}</span> to <span className="text-indigo-950 font-bold">{Math.min(endIndex, logs.length)}</span> of <span className="text-indigo-950 font-bold">{logs.length}</span>
                </span>
              </div>
              {paginatedLogs.map((log) => {
                const initials = log.userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                const userBgColor = log.userType === "admin" ? "bg-purple-100" : "bg-blue-100";

                return (
                  <div key={log._id}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md overflow-hidden flex-shrink-0 ${!log.userImage && userBgColor}`}>
                          {log.userImage ? (
                            <img 
                              src={log.userImage} 
                              alt={log.userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{log.userName}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              log.userType === "admin" 
                                ? "bg-purple-100 text-purple-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {log.userType}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                              {log.resourceType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(log.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-600 max-w-xs text-right truncate">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-950 hover:bg-indigo-900 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all duration-200 ${
                        currentPage === pageNum
                          ? "bg-indigo-950 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-950 hover:bg-indigo-900 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
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

export default ActivityLogs;
