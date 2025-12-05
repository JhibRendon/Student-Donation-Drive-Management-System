/**
 * Campaign Info Card Component
 * Modern professional display of campaign details
 */
import React from "react";
import Card from "./Card";

const CampaignInfoCard = ({ drive, fadeIn }) => {
  const cashProgress = drive.goalAmount
    ? Math.min(((drive.currentAmount || 0) / drive.goalAmount) * 100, 100)
    : 0;

  return (
    <Card
      className={`lg:col-span-2 space-y-8 transition-all duration-700 ease-out ${
        fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      variant="default"
    >
      {/* Campaign Image */}
      {drive.campaignPhoto && (
        <div className="flex justify-center mb-4 overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
          <img
            src={drive.campaignPhoto}
            alt={drive.title}
            className="w-full h-72 object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Campaign Header */}
      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-gray-900 leading-tight">
          {drive.title}
        </h3>
        <p className="text-gray-600 text-lg leading-relaxed">
          {drive.fullStory || drive.shortDescription}
        </p>
      </div>

      {/* Campaign Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-gray-100">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Category
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {drive.category || "N/A"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Deadline
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {drive.deadline
              ? new Date(drive.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Beneficiary
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {drive.beneficiaryName || "N/A"}
          </p>
        </div>
      </div>

      {/* Cash Donations Section */}
      {(drive.donationType === "Cash" || drive.donationType === "Both") && (
        <Card
          variant="gradient"
          gradientFrom="from-blue-100"
          gradientTo="to-indigo-100"
          className="space-y-6 mt-6 border-2 border-blue-300"
          hoverEffect={false}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              💰
            </div>
            <h4 className="text-2xl font-bold text-gray-900">
              Cash Donations
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Goal Amount
              </p>
              <p className="text-3xl font-bold text-blue-600">
                ₱{(drive.goalAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Current Amount
              </p>
              <p className="text-3xl font-bold text-green-600">
                ₱{(drive.currentAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">
                Progress
              </span>
              <span className="text-sm font-bold text-blue-600">
                {Math.round(cashProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ width: `${cashProgress}%` }}
              />
            </div>
          </div>

          {/* GCash Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-blue-200">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                GCash Recipient
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {drive.gcashName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Contact Number
              </p>
              <p className="text-lg font-mono font-semibold text-gray-900 tracking-wider">
                {drive.gcashNumber || "N/A"}
              </p>
            </div>
          </div>

          {/* GCash QR Code */}
          {drive.gcashQr && (
            <div className="flex flex-col items-center pt-4 border-t border-blue-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                Scan to Pay
              </p>
              <img
                src={drive.gcashQr}
                alt="GCash QR Code"
                className="w-40 h-40 object-contain rounded-xl border-4 border-white shadow-lg"
              />
            </div>
          )}
        </Card>
      )}

      {/* Goods Donations Section */}
      {(drive.donationType === "Goods" || drive.donationType === "Both") && (
        <Card
          variant="gradient"
          gradientFrom="from-emerald-100"
          gradientTo="to-teal-100"
          className="space-y-6 mt-6 border-2 border-emerald-300"
          hoverEffect={false}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
              📦
            </div>
            <h4 className="text-2xl font-bold text-gray-900">
              Goods & In-Kind Donations
            </h4>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Accepted Items
            </p>
            <p className="text-lg text-gray-900 leading-relaxed">
              {drive.acceptedGoods || "N/A"}
            </p>
          </div>

          {/* Goods Photo */}
          {drive.goodsPhoto && (
            <div className="flex justify-center pt-4 border-t border-emerald-200">
              <img
                src={drive.goodsPhoto}
                alt="Goods"
                className="w-full max-w-sm h-56 object-contain rounded-xl border-4 border-white shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </div>
          )}
        </Card>
      )}
    </Card>
  );
};

export default CampaignInfoCard;
