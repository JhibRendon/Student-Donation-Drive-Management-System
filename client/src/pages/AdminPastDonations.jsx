import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Gift, Users, FileText, LogOut, Settings, 
  Activity, Archive, Filter, Calendar, Search, Download
} from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import Swal from "sweetalert2";
import { getAdminData, getAdminToken, clearAdminStorage } from "../utils/storageHelper.js";

const AdminPastDonations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    donor: "",
    campaign: "",
    type: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

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
    fetchDonations();
  }, [filters]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const token = getAdminToken();
      const response = await axios.get("http://localhost:5000/api/admin/reports/donations", { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        let filteredDonations = response.data.donations || [];

        // Apply additional filters
        if (filters.donor) {
          filteredDonations = filteredDonations.filter(d => 
            d.donor?.name?.toLowerCase().includes(filters.donor.toLowerCase())
          );
        }
        if (filters.campaign) {
          filteredDonations = filteredDonations.filter(d => 
            d.driveId?.title?.toLowerCase().includes(filters.campaign.toLowerCase())
          );
        }
        if (filters.type) {
          filteredDonations = filteredDonations.filter(d => 
            d.type?.toLowerCase().includes(filters.type.toLowerCase())
          );
        }
        if (searchQuery) {
          filteredDonations = filteredDonations.filter(d => 
            d.donor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.driveId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.type?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setDonations(filteredDonations);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load donations",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const headerHeight = 50;
    const footerHeight = 30;
    let y = headerHeight + 10;
    let pageNumber = 1;
    const maxY = pageHeight - footerHeight;

    // Modern Color Palette
    const primaryColor = [30, 58, 138]; // Deep Indigo
    const accentColor = [249, 115, 22]; // Orange
    const lightGray = [249, 250, 251];
    const borderGray = [229, 231, 235];
    const tableHeaderColor = [241, 245, 249];

    // Helper function to add header
    const addHeader = () => {
      // Header background with gradient effect
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      
      // Accent stripe
      doc.setFillColor(...accentColor);
      doc.rect(0, headerHeight - 5, pageWidth, 5, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Student Donation Drive", margin, 20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Management System", margin, 30);
      
      // Report title badge (center)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...accentColor);
      doc.setLineWidth(0.5);
      const titleWidth = doc.getTextWidth("Past Donations Report") + 20;
      doc.roundedRect((pageWidth - titleWidth) / 2, 15, titleWidth, 20, 3, 3, "FD");
      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Past Donations Report", pageWidth / 2, 28, { align: "center" });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
      const timeStr = new Date().toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      doc.text(`Generated: ${dateStr}`, pageWidth - margin, 20, { align: "right" });
      doc.text(`Time: ${timeStr}`, pageWidth - margin, 28, { align: "right" });
      
      doc.setTextColor(0, 0, 0);
    };

    // Helper function to add footer
    const addFooter = (pageNum) => {
      const footerY = pageHeight - footerHeight;
      
      // Footer background
      doc.setFillColor(...lightGray);
      doc.rect(0, footerY, pageWidth, footerHeight, "F");
      
      // Footer top border
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      
      // Left side - Official Document badge
      doc.setFillColor(...primaryColor);
      doc.roundedRect(margin, footerY + 5, 50, 8, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("OFFICIAL", margin + 25, footerY + 9.5, { align: "center" });
      
      // Center - Page number
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Page ${pageNum}`, pageWidth / 2, footerY + 10, { align: "center" });
      
      // Right side - Date and time
      const footerDate = new Date().toLocaleDateString("en-US");
      const footerTime = new Date().toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      doc.text(`${footerDate} ${footerTime}`, pageWidth - margin, footerY + 10, { align: "right" });
      
      // Signature line area
      doc.setFontSize(8);
      doc.setDrawColor(...borderGray);
      doc.line(margin, footerY + 18, margin + 60, footerY + 18);
      doc.setTextColor(80, 80, 80);
      doc.text("Authorized Signature", margin, footerY + 23);
      
      doc.setTextColor(0, 0, 0);
    };

    addHeader();

    // Summary Section
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, y - 6, pageWidth - 2 * margin, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", margin + 5, y);
    y += 12;

    // Summary box
    doc.setFillColor(...lightGray);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 12, 3, 3, "FD");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Total Donations:", margin + 8, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${donations.length}`, margin + 50, y);
    doc.setTextColor(30, 30, 30);
    y += 18;

    // Table header - Modern style
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(...tableHeaderColor);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 8, 2, 2, "FD");
    
    doc.setTextColor(...primaryColor);
    doc.text("Donor", margin + 2, y);
    doc.text("Campaign", margin + 50, y);
    doc.text("Type", margin + 100, y);
    doc.text("Amount/Item", margin + 130, y);
    doc.text("Date", margin + 170, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    doc.setFont("helvetica", "normal");
    donations.forEach((donation, index) => {
      if (y > maxY) {
        addFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        addHeader();
        y = headerHeight + 10;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(...tableHeaderColor);
        doc.setDrawColor(...borderGray);
        doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 8, 2, 2, "FD");
        doc.setTextColor(...primaryColor);
        doc.text("Donor", margin + 2, y);
        doc.text("Campaign", margin + 50, y);
        doc.text("Type", margin + 100, y);
        doc.text("Amount/Item", margin + 130, y);
        doc.text("Date", margin + 170, y);
        doc.setTextColor(0, 0, 0);
        y += 10;
        doc.setFont("helvetica", "normal");
      }

      const donorName = (donation.donor?.name || "N/A").substring(0, 20);
      const campaignName = (donation.driveId?.title || "N/A").substring(0, 20);
      const type = (donation.type || "N/A").substring(0, 15);
      
      // Format amount/item based on donation type
      let amount = "N/A";
      if (donation.type?.toLowerCase().includes("cash")) {
        const cashAmount = Number(donation.cashAmount) || 0;
        const formatted = cashAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        amount = `P ${formatted}`;
      } else if (donation.type?.toLowerCase().includes("goods")) {
        amount = (donation.goodsDescription || "Goods").substring(0, 25);
      }
      
      const date = new Date(donation.createdAt).toLocaleDateString();

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(...lightGray);
      }
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 6, "F");

      doc.setTextColor(30, 30, 30);
      doc.text(donorName, margin + 2, y);
      doc.text(campaignName, margin + 50, y);
      doc.text(type, margin + 100, y);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text(amount, margin + 130, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(date, margin + 170, y);
      y += 7;
    });

    addFooter(pageNumber);
    doc.save(`past_donations_${new Date().toISOString().split("T")[0]}.pdf`);
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

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      donor: "",
      campaign: "",
      type: "",
    });
    setSearchQuery("");
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

        {/* Logout Button */}
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
      <main className="flex-1 p-6 ml-60">
        <header className="flex justify-between items-center border-b-2 border-indigo-950 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950">
              Past Donations
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage all past donations history
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </header>

        {/* SEARCH AND FILTERS */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Filter className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-800">Search & Filters</h3>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by donor name, campaign, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Donor Name</label>
              <input
                type="text"
                value={filters.donor}
                onChange={(e) => setFilters({ ...filters, donor: e.target.value })}
                placeholder="Filter by donor"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign</label>
              <input
                type="text"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                placeholder="Filter by campaign"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="">All Types</option>
                <option value="cash">Cash</option>
                <option value="goods">Goods</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all duration-300 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* DONATIONS TABLE */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 font-medium">Loading donations...</p>
            </div>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No donations found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                All Donations <span className="text-indigo-600">({donations.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Donor</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Campaign</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Type</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Amount/Item</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation, index) => (
                    <tr key={donation._id} className={`border-b border-gray-100 transition-colors ${
                      index % 2 === 0 ? "hover:bg-indigo-50" : "bg-gray-50 hover:bg-indigo-50"
                    }`}>
                      <td className="py-4 px-4 font-medium text-gray-800">{donation.donor?.name || "N/A"}</td>
                      <td className="py-4 px-4 text-gray-700">{donation.driveId?.title || "N/A"}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          donation.type?.toLowerCase().includes("cash")
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {donation.type || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-indigo-600">
                        {donation.type?.toLowerCase().includes("cash")
                          ? `₱${Number(donation.cashAmount || 0).toLocaleString()}`
                          : donation.goodsDescription || "Goods"}
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(donation.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

export default AdminPastDonations;

