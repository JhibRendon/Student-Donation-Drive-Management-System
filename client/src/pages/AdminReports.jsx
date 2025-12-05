import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Download, Calendar, Filter
} from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import { getAdminData, getAdminToken } from "../utils/storageHelper.js";

// Utility function to safely convert and format amounts
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "₱0.00";
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  if (isNaN(num)) return "₱0.00";
  return `₱${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Utility function to safely convert to number
const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return isNaN(num) ? 0 : num;
};

const AdminReports = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("donations");
  const [donationReport, setDonationReport] = useState(null);
  const [campaignReport, setCampaignReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    campaignId: "",
    category: "",
    status: "",
  });
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

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
    fetchReports();
    fetchCategories();
    fetchCampaigns();
  }, [activeTab, filters]);

  const fetchCampaigns = async () => {
    try {
      const token = getAdminToken();
      const response = await axios.get("http://localhost:5000/api/admin/campaigns", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const approved = response.data.campaigns.filter(c => c.status === "Approved");
        setCampaigns(approved);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getAdminToken();
      const response = await axios.get("http://localhost:5000/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      if (activeTab === "donations") {
        const params = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.campaignId) params.campaignId = filters.campaignId;

        const response = await axios.get("http://localhost:5000/api/admin/reports/donations", { 
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setDonationReport(response.data);
        }
      } else {
        const params = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.status) params.status = filters.status;
        if (filters.category) params.category = filters.category;

        const response = await axios.get("http://localhost:5000/api/admin/reports/campaigns", { 
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setCampaignReport(response.data);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch reports",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      if (!donationReport && !campaignReport) {
        Swal.fire({
          icon: "warning",
          title: "No Data",
          text: "Please load report data first",
        });
        return;
      }

      // Generate unique report ID
      const reportTimestamp = Date.now();
      const reportId = `RPT-${activeTab.toUpperCase().substring(0, 3)}-${reportTimestamp}`;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 5;
      let y = margin;
      let pageNum = 1;

      // Color scheme
      const primaryBlue = [30, 58, 138];
      const accentOrange = [249, 115, 22];
      const lightGray = [245, 245, 245];
      const darkText = [50, 50, 50];
      const white = [255, 255, 255];

      // Function to add page header
      const addPageHeader = () => {
        // Header background
        doc.setFillColor(...primaryBlue);
        doc.rect(0, 0, pageWidth, 30, "F");

        // Title
        doc.setTextColor(...white);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Student Donation Drive Management System", margin, 10);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${activeTab === "donations" ? "Donation" : "Campaign"} Report`, margin, 18);

        // Report ID and date on right
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        const generatedDate = new Date().toLocaleDateString();
        const generatedTime = new Date().toLocaleTimeString();
        doc.text(`Report ID: ${reportId}`, pageWidth - margin, 10, { align: "right" });
        doc.text(`Generated: ${generatedDate} ${generatedTime}`, pageWidth - margin, 18, { align: "right" });

        // Orange accent line
        doc.setFillColor(...accentOrange);
        doc.rect(0, 30, pageWidth, 2, "F");

        return 32;
      };

      // Function to add page footer
      const addPageFooter = () => {
        const footerY = pageHeight - 12;
        // Footer line
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${pageNum} of Report: ${reportId}`, margin, footerY);
        doc.text("© Student Donation Drive System", pageWidth - margin, footerY, { align: "right" });
      };

      // Add first page header
      y = addPageHeader();
      y += margin;

      // Report content
      if (activeTab === "donations" && donationReport) {
        // Summary Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryBlue);
        doc.text("SUMMARY", margin, y);
        y += 8;

        // Summary box
        doc.setFillColor(...lightGray);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 40, "F");
        doc.setDrawColor(...accentOrange);
        doc.setLineWidth(0.5);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 40);

        // Summary items with proper formatting
        const summaryItems = [
          ["Total Donations:", `${donationReport.summary?.totalDonations || 0}`],
          ["Total Cash:", formatCurrency(donationReport.summary?.totalCash)],
          ["Cash Donations:", `${donationReport.summary?.cashDonations || 0}`],
          ["Goods Donations:", `${donationReport.summary?.goodsDonations || 0}`],
        ];

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...darkText);
        let summaryY = y + 5;
        summaryItems.forEach((item, index) => {
          if (index === 1) {
            // Make total cash bold and colored
            doc.setFont("helvetica", "bold");
            doc.setTextColor(25, 80, 150);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...darkText);
          }
          doc.text(`${item[0]}`, margin + 5, summaryY);
          doc.text(`${item[1]}`, pageWidth - margin - 5, summaryY, { align: "right" });
          summaryY += 8;
        });

        y += 48;

        // Donations table
        if (donationReport.donations && donationReport.donations.length > 0) {
          if (y > pageHeight - 60) {
            doc.addPage();
            pageNum++;
            y = addPageHeader() + margin;
          }

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryBlue);
          doc.text("DONATION DETAILS", margin, y);
          y += 8;

          const tableData = donationReport.donations.map((donation) => {
            const amount = toNumber(donation.cashAmount);
            const displayAmount = donation.type?.toLowerCase().includes("cash")
              ? formatCurrency(amount)
              : donation.goodsDescription || "Goods Item";
            return [
              donation.donorId?.name || "N/A",
              donation.driveId?.title || "N/A",
              donation.type || "N/A",
              displayAmount,
              new Date(donation.createdAt).toLocaleDateString(),
            ];
          });

          doc.autoTable({
            head: [["Donor Name", "Campaign", "Type", "Amount/Item", "Date"]],
            body: tableData,
            startY: y,
            margin: { top: y, left: margin, right: margin, bottom: 20 },
            theme: "grid",
            styles: {
              fontSize: 8,
              cellPadding: 4,
              textColor: darkText,
              halign: "left",
              valign: "middle",
            },
            headStyles: {
              fillColor: primaryBlue,
              textColor: white,
              fontStyle: "bold",
              halign: "center",
              fontSize: 9,
            },
            alternateRowStyles: {
              fillColor: lightGray,
            },
            columnStyles: {
              3: { halign: "right", fontStyle: "bold", textColor: [25, 80, 150] },
              4: { halign: "center" },
            },
            didDrawPage: (data) => {
              // Don't add footer during table draw, we'll do it once at the end
            },
          });
        }
      } else if (activeTab === "campaigns" && campaignReport) {
        // Summary Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryBlue);
        doc.text("SUMMARY", margin, y);
        y += 8;

        // Summary box
        doc.setFillColor(...lightGray);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 48, "F");
        doc.setDrawColor(...accentOrange);
        doc.setLineWidth(0.5);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 48);

        // Summary items
        const summaryItems = [
          ["Total Campaigns:", `${campaignReport.summary?.totalCampaigns || 0}`],
          ["Total Goal:", formatCurrency(campaignReport.summary?.totalGoal)],
          ["Total Raised:", formatCurrency(campaignReport.summary?.totalRaised)],
          ["Completion Rate:", `${campaignReport.summary?.completionRate || 0}%`],
        ];

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...darkText);
        let summaryY = y + 5;
        summaryItems.forEach((item, index) => {
          if (index === 1 || index === 2) {
            // Make monetary values bold and colored
            doc.setFont("helvetica", "bold");
            doc.setTextColor(25, 80, 150);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...darkText);
          }
          doc.text(`${item[0]}`, margin + 5, summaryY);
          doc.text(`${item[1]}`, pageWidth - margin - 5, summaryY, { align: "right" });
          summaryY += 8;
        });

        y += 56;

        // Campaigns table
        if (campaignReport.campaigns && campaignReport.campaigns.length > 0) {
          if (y > pageHeight - 60) {
            doc.addPage();
            pageNum++;
            y = addPageHeader() + margin;
          }

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryBlue);
          doc.text("CAMPAIGN DETAILS", margin, y);
          y += 8;

          const tableData = campaignReport.campaigns.map((campaign) => {
            const goalAmount = toNumber(campaign.goalAmount);
            const currentAmount = toNumber(campaign.currentAmount);
            const progress =
              goalAmount > 0 ? ((currentAmount / goalAmount) * 100).toFixed(1) : 0;
            return [
              campaign.title || "N/A",
              campaign.category || "N/A",
              campaign.status || "N/A",
              formatCurrency(goalAmount),
              formatCurrency(currentAmount),
              `${progress}%`,
            ];
          });

          doc.autoTable({
            head: [["Title", "Category", "Status", "Goal Amount", "Raised Amount", "Progress"]],
            body: tableData,
            startY: y,
            margin: { top: y, left: margin, right: margin, bottom: 20 },
            theme: "grid",
            styles: {
              fontSize: 8,
              cellPadding: 4,
              textColor: darkText,
              halign: "left",
              valign: "middle",
            },
            headStyles: {
              fillColor: primaryBlue,
              textColor: white,
              fontStyle: "bold",
              halign: "center",
              fontSize: 9,
            },
            alternateRowStyles: {
              fillColor: lightGray,
            },
            columnStyles: {
              3: { halign: "right", fontStyle: "bold", textColor: [25, 80, 150] },
              4: { halign: "right", fontStyle: "bold", textColor: [25, 80, 150] },
              5: { halign: "center" },
            },
            didDrawPage: (data) => {
              // Don't add footer during table draw
            },
          });
        }
      }

      // Add footer to final page
      addPageFooter();

      // Save PDF with unique filename
      const timestamp = new Date().toISOString().split("T")[0];
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${activeTab}_report_${timestamp}_${randomSuffix}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Report exported successfully!\nReport ID: ${reportId}`,
        confirmButtonColor: "#1e3a8a",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Failed to export PDF. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* HEADER */}
      <header className="flex justify-between items-start border-b-2 border-indigo-950 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950 mb-1 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 font-medium">Generate and export comprehensive reports</p>
          </div>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              <span>Export PDF</span>
            </button>
          </header>

          {/* TABS */}
          <div className="flex gap-4 mb-8 border-b border-gray-300">
            <button
              onClick={() => setActiveTab("donations")}
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === "donations"
                  ? "text-orange-500"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Donation Reports
              {activeTab === "donations" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === "campaigns"
                  ? "text-green-500"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Campaign Reports
              {activeTab === "campaigns" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-t-full"></div>
              )}
            </button>
          </div>

          {/* FILTERS */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-50 rounded-lg">
                <Filter className="w-5 h-5 text-indigo-950" />
              </div>
              <h3 className="font-bold text-lg text-indigo-950">Quick Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" /> Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {activeTab === "donations" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign</label>
                  <select
                    value={filters.campaignId}
                    onChange={(e) => setFilters({ ...filters, campaignId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="">All Campaigns</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign._id} value={campaign._id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      <option value="">All Status</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-950 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading reports...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "donations" && donationReport && (
                <div className="space-y-8">
                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SummaryCard
                      title="Total Donations"
                      value={donationReport.summary?.totalDonations || 0}
                      color="blue"
                    />
                    <SummaryCard
                      title="Total Cash"
                      value={`₱${Number(donationReport.summary?.totalCash || 0).toLocaleString()}`}
                      color="green"
                    />
                    <SummaryCard
                      title="Cash Donations"
                      value={donationReport.summary?.cashDonations || 0}
                      color="orange"
                    />
                    <SummaryCard
                      title="Goods Donations"
                      value={donationReport.summary?.goodsDonations || 0}
                      color="purple"
                    />
                  </div>

                  {/* DONATIONS TABLE */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-indigo-950 mb-6">Recent Donations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Donor</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Campaign</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount/Item</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donationReport.donations?.map((donation, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-6 py-4 text-sm text-gray-700">{donation.donorId?.name || "N/A"}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{donation.driveId?.title || "N/A"}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{donation.type}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-indigo-950">
                                {donation.type?.includes("cash")
                                  ? `₱${Number(donation.cashAmount || 0).toLocaleString()}`
                                  : donation.goodsDescription || "Goods"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{new Date(donation.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "campaigns" && campaignReport && (
                <div className="space-y-8">
                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SummaryCard
                      title="Total Campaigns"
                      value={campaignReport.summary?.totalCampaigns || 0}
                      color="blue"
                    />
                    <SummaryCard
                      title="Total Goal"
                      value={`₱${Number(campaignReport.summary?.totalGoal || 0).toLocaleString()}`}
                      color="orange"
                    />
                    <SummaryCard
                      title="Total Raised"
                      value={`₱${Number(campaignReport.summary?.totalRaised || 0).toLocaleString()}`}
                      color="green"
                    />
                    <SummaryCard
                      title="Avg. Completion"
                      value={`${campaignReport.summary?.completionRate || 0}%`}
                      color="purple"
                    />
                  </div>

                  {/* CAMPAIGNS TABLE */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-indigo-950 mb-6">Campaign Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Goal</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Raised</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignReport.campaigns?.map((campaign, index) => {
                            const progress = campaign.goalAmount > 0
                              ? ((campaign.currentAmount / campaign.goalAmount) * 100).toFixed(1)
                              : 0;
                            return (
                              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-700">{campaign.title}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{campaign.category}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    campaign.status === "Approved" ? "bg-green-100 text-green-700" :
                                    campaign.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {campaign.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-indigo-950">₱{Number(campaign.goalAmount || 0).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-orange-600">₱{Number(campaign.currentAmount || 0).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-indigo-950 h-2 rounded-full"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{progress}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    };

const SummaryCard = ({ title, value, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    green: "bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-700",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-700",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-700",
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
      <h3 className="text-gray-600 text-sm font-semibold mb-3">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

export default AdminReports;
