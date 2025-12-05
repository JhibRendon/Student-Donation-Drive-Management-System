import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Gift, Users, FileText, LogOut, Settings, 
  Activity, Archive, RotateCcw, Trash2, Eye, X, Mail, Phone
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { getAdminData, getAdminToken, clearAdminStorage } from "../utils/storageHelper.js";

const ArchivePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

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
    fetchArchivedCampaigns();
  }, []);

  const fetchArchivedCampaigns = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const response = await axios.get("http://localhost:5000/api/admin/campaigns", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter only archived campaigns
        const archived = response.data.campaigns.filter(c => c.status === "Archived");
        setCampaigns(archived);
      }
    } catch (error) {
      console.error("Error fetching archived campaigns:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load archived campaigns",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (campaignId) => {
    const result = await Swal.fire({
      title: "Restore Campaign?",
      text: "This campaign will be restored to Pending status",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore it",
    });

    if (result.isConfirmed) {
      try {
        const adminData = getAdminData() || {};
        const token = getAdminToken();
        const response = await axios.put(`http://localhost:5000/api/admin/campaigns/${campaignId}/restore`, {
          adminId: adminData._id || "system",
          adminName: adminData.name || "Admin",
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          Swal.fire({
            title: "Restored!",
            text: "Campaign has been restored to Pending status",
            icon: "success",
            timer: 1500,
          });
          fetchArchivedCampaigns();
        }
      } catch (error) {
        console.error("Error restoring campaign:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to restore campaign",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (campaignId) => {
    const result = await Swal.fire({
      title: "Permanently Delete?",
      text: "This action cannot be undone! The campaign will be permanently deleted from the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete permanently",
      dangerMode: true,
    });

    if (result.isConfirmed) {
      try {
        const adminData = getAdminData() || {};
        const token = getAdminToken();
        const response = await axios.delete(`http://localhost:5000/api/admin/campaigns/${campaignId}`, {
          data: {
            adminId: adminData._id || "system",
            adminName: adminData.name || "Admin",
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          Swal.fire({
            title: "Deleted!",
            text: "Campaign has been permanently deleted",
            icon: "success",
            timer: 1500,
          });
          fetchArchivedCampaigns();
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        Swal.fire({
          title: "Error",
          text: error.response?.data?.message || "Failed to delete campaign",
          icon: "error",
        });
      }
    }
  };

  const handleView = (campaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
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

  // Filter campaigns based on search
  const filteredCampaigns = campaigns.filter(campaign => {
    const searchLower = searchQuery.toLowerCase();
    return (
      campaign.title?.toLowerCase().includes(searchLower) ||
      campaign.category?.toLowerCase().includes(searchLower) ||
      campaign.beneficiaryName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-60 bg-indigo-950 text-white flex flex-col py-6 fixed left-0 top-0 h-screen">
        <div className="flex flex-col items-center flex-1 overflow-y-auto px-2">
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
      <main className="flex-1 p-6 ml-60">
        <header className="flex justify-between items-center border-b-2 border-indigo-950 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950">
              Archived Campaigns
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Total Archived: <span className="font-semibold text-indigo-600">{campaigns.length}</span>
            </p>
          </div>
          <button
            onClick={fetchArchivedCampaigns}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-950 text-white rounded-lg hover:bg-indigo-900 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Activity className="w-5 h-5" />
            <span className="font-semibold">Refresh</span>
          </button>
        </header>

        {/* SEARCH BAR */}
        <div className="mb-6">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2.5 shadow-sm max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search archived campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* ARCHIVED CAMPAIGNS */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 font-medium">Loading archived campaigns...</p>
            </div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery ? "No archived campaigns match your search" : "No archived campaigns"}
            </p>
            <p className="text-gray-400 text-sm">
              {searchQuery ? "Try a different search term" : "Archived campaigns will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Campaign Image with Badge */}
                <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {campaign.campaignPhoto ? (
                    <img
                      src={campaign.campaignPhoto}
                      alt={campaign.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <FileText className="w-20 h-20 text-gray-300" />
                    </div>
                  )}
                  {/* Archived Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                      ARCHIVED
                    </span>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 hover:text-indigo-600 transition">
                    {campaign.title}
                  </h3>
                  <div className="space-y-2.5 mb-5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Category:</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{campaign.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Beneficiary:</span>
                      <span className="text-gray-700 font-semibold truncate text-right ml-2">{campaign.beneficiaryName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Archived:</span>
                      <span className="text-gray-600 text-xs">{campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleView(campaign)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleRestore(campaign._id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(campaign._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CAMPAIGN DETAIL MODAL */}
      {showModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-950 to-indigo-900 px-8 py-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-3xl font-bold text-white">Campaign Details</h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-orange-400 hover:text-indigo-950 rounded-full p-2 transition-all duration-300 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Campaign Image */}
              {selectedCampaign.campaignPhoto && (
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={selectedCampaign.campaignPhoto}
                    alt={selectedCampaign.title}
                    className="w-full h-80 object-cover"
                  />
                </div>
              )}

              {/* Campaign Title and Status */}
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-indigo-950">{selectedCampaign.title}</h3>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
                    {selectedCampaign.category}
                  </span>
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                    🗃️ Archived
                  </span>
                  {selectedCampaign.isHighPriority && (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                      🚨 High Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-indigo-50 rounded-xl p-6 space-y-3">
                <h4 className="text-lg font-semibold text-indigo-950">Short Description</h4>
                <p className="text-indigo-900">{selectedCampaign.shortDescription}</p>
              </div>

              <div className="bg-indigo-50 rounded-xl p-6 space-y-3">
                <h4 className="text-lg font-semibold text-indigo-950">Full Story</h4>
                <p className="text-indigo-900 leading-relaxed">{selectedCampaign.fullDescription}</p>
              </div>

              {/* Goal Amount */}
              <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-xl p-6">
                <p className="text-sm text-indigo-700 mb-2">Goal Amount</p>
                <p className="text-4xl font-bold text-indigo-950">₱{selectedCampaign.goalAmount.toLocaleString()}</p>
                <p className="text-sm text-indigo-600 mt-3">Current Amount: ₱{(selectedCampaign.currentAmount || 0).toLocaleString()}</p>
              </div>

              {/* Donation Type */}
              <div className="bg-indigo-50 rounded-xl p-6 space-y-4">
                <h4 className="text-lg font-semibold text-indigo-950">Donation Type</h4>
                <p className="text-lg font-bold text-indigo-900">{selectedCampaign.donationType}</p>

                {/* Payment Details */}
                {selectedCampaign.donationType === "Cash" && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {selectedCampaign.gcashName && (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">GCash Name</p>
                        <p className="font-semibold text-indigo-950">{selectedCampaign.gcashName}</p>
                      </div>
                    )}
                    {selectedCampaign.gcashNumber && (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">GCash Number</p>
                        <p className="font-semibold text-indigo-950">{selectedCampaign.gcashNumber}</p>
                      </div>
                    )}
                    {selectedCampaign.bankName && (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                        <p className="font-semibold text-indigo-950">{selectedCampaign.bankName}</p>
                      </div>
                    )}
                    {selectedCampaign.bankNumber && (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Bank Number</p>
                        <p className="font-semibold text-indigo-950">{selectedCampaign.bankNumber}</p>
                      </div>
                    )}
                    {selectedCampaign.paypalLink && (
                      <div className="bg-white p-4 rounded-lg col-span-2">
                        <p className="text-sm text-gray-600 mb-1">PayPal Link</p>
                        <a href={selectedCampaign.paypalLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 break-all">
                          {selectedCampaign.paypalLink}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {selectedCampaign.donationType === "In Kind" && selectedCampaign.acceptedGoods && (
                  <div className="bg-white p-4 rounded-lg mt-4">
                    <p className="text-sm text-gray-600 mb-2">Accepted Items</p>
                    <p className="text-indigo-950">{selectedCampaign.acceptedGoods}</p>
                  </div>
                )}

                {selectedCampaign.donationType === "Services" && selectedCampaign.acceptedGoods && (
                  <div className="bg-white p-4 rounded-lg mt-4">
                    <p className="text-sm text-gray-600 mb-2">Services Needed</p>
                    <p className="text-indigo-950">{selectedCampaign.acceptedGoods}</p>
                  </div>
                )}
              </div>

              {/* Beneficiary Information */}
              <div className="bg-indigo-50 rounded-xl p-6 space-y-4">
                <h4 className="text-lg font-semibold text-indigo-950">Beneficiary Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg space-y-1">
                    <p className="text-sm text-gray-600">Name / Organization</p>
                    <p className="font-semibold text-indigo-950">{selectedCampaign.beneficiaryName}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg space-y-1 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a href={`mailto:${selectedCampaign.email}`} className="font-semibold text-blue-600 hover:text-blue-800">
                        {selectedCampaign.email}
                      </a>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg space-y-1 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Number</p>
                      <a href={`tel:${selectedCampaign.contactNumber}`} className="font-semibold text-blue-600 hover:text-blue-800">
                        {selectedCampaign.contactNumber}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-600 space-y-2">
                <p>Created: {new Date(selectedCampaign.createdAt).toLocaleString()}</p>
                <p>Archived: {new Date(selectedCampaign.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-8 py-4 border-t-2 border-gray-200 flex gap-4 justify-end rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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

export default ArchivePage;

