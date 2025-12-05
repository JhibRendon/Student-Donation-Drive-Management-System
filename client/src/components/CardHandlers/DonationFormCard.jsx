/**
 * Donation Form Card Component
 * Modern professional donation input interface
 */
import React from "react";
import Card from "./Card";

const DonationFormCard = ({
  donationType,
  setDonationType,
  cashAmount,
  setCashAmount,
  goodsDescription,
  setGoodsDescription,
  deliveryDate,
  setDeliveryDate,
  goodsPhoto,
  setGoodsPhoto,
  gcashReceipt,
  setGcashReceipt,
  donorInfo,
  confirmDetails,
  setConfirmDetails,
  errors,
  onDonate,
  onCancel,
  isSubmitting = false,
}) => {
  const handleFileChange = (e) => setGoodsPhoto(e.target.files[0]);
  const handleGcashReceiptChange = (e) => setGcashReceipt(e.target.files[0]);

  const quickAmounts = [100, 500, 1000, 2000];

  return (
    <Card className="space-y-6" variant="elevated">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          💝 Make Your Donation
        </h3>
        <p className="text-gray-600">Choose your donation type and amount</p>
      </div>

      {/* Donation Type Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-gray-600">
            Donation Type
          </span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {["Cash", "Goods", "Both"].map((type) => (
            <button
              key={type}
              onClick={() => setDonationType(type)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                donationType === type
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cash Donation Section */}
      {(donationType === "Cash" || donationType === "Both") && (
        <Card
          variant="gradient"
          gradientFrom="from-blue-100"
          gradientTo="to-indigo-100"
          className="space-y-5 border-2 border-blue-400"
          hoverEffect={false}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
              💵
            </div>
            <h4 className="text-lg font-bold text-gray-900">Cash Amount</h4>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Quick Select
            </p>
            <div className="grid grid-cols-2 gap-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashAmount(amt)}
                  className={`px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                    cashAmount === amt.toString()
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                      : "bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  ₱{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Custom Amount
            </label>
            <input
              type="number"
              placeholder="Enter custom amount"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold text-lg"
            />
            {errors.cashAmount && (
              <p className="text-red-600 text-sm mt-2 font-medium">
                ⚠️ {errors.cashAmount}
              </p>
            )}
          </div>

          {/* GCash Receipt Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide block">
              📸 GCash Receipt
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleGcashReceiptChange}
                className="hidden"
                id="gcash-receipt"
              />
              <label
                htmlFor="gcash-receipt"
                className="block border-2 border-dashed border-blue-300 rounded-xl px-4 py-4 text-center cursor-pointer hover:bg-blue-50 transition"
              >
                {gcashReceipt ? (
                  <div className="text-green-600 font-semibold">
                    ✅ {gcashReceipt.name}
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <p className="font-semibold">Click to upload receipt</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                )}
              </label>
            </div>
            {errors.gcashReceipt && (
              <p className="text-red-600 text-sm font-medium">
                ⚠️ {errors.gcashReceipt}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Goods Donation Section */}
      {(donationType === "Goods" || donationType === "Both") && (
        <Card
          variant="gradient"
          gradientFrom="from-emerald-100"
          gradientTo="to-teal-100"
          className="space-y-5 border-2 border-emerald-400"
          hoverEffect={false}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">
              📦
            </div>
            <h4 className="text-lg font-bold text-gray-900">Goods Details</h4>
          </div>

          {/* Goods Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide block">
              Description
            </label>
            <textarea
              value={goodsDescription}
              onChange={(e) => setGoodsDescription(e.target.value)}
              placeholder="Describe the items you want to donate..."
              className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full h-24 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
            />
            {errors.goodsDescription && (
              <p className="text-red-600 text-sm font-medium">
                ⚠️ {errors.goodsDescription}
              </p>
            )}
          </div>

          {/* Goods Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide block">
              📷 Photo of Items
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="goods-photo"
              />
              <label
                htmlFor="goods-photo"
                className="block border-2 border-dashed border-emerald-300 rounded-xl px-4 py-4 text-center cursor-pointer hover:bg-emerald-50 transition"
              >
                {goodsPhoto ? (
                  <div className="text-green-600 font-semibold">
                    ✅ {goodsPhoto.name}
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <p className="font-semibold">Click to upload photo</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                )}
              </label>
            </div>
            {errors.goodsPhoto && (
              <p className="text-red-600 text-sm font-medium">
                ⚠️ {errors.goodsPhoto}
              </p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide block">
              📅 Delivery Date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-semibold"
            />
            {errors.deliveryDate && (
              <p className="text-red-600 text-sm font-medium">
                ⚠️ {errors.deliveryDate}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Donor Information Section */}
      <Card
        variant="outlined"
        className="space-y-4 bg-gradient-to-br from-gray-50 to-gray-100"
        hoverEffect={false}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-xl">
            👤
          </div>
          <h4 className="text-lg font-bold text-gray-900">Donor Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "name", label: "Full Name" },
            { key: "email", label: "Email" },
            { key: "contactNumber", label: "Contact Number" },
            { key: "address", label: "Address" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                {label}
              </label>
              <input
                type="text"
                value={donorInfo[key] || ""}
                readOnly
                className="border border-gray-300 bg-white rounded-lg px-4 py-2 w-full text-sm font-medium text-gray-900 cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Confirmation Checkbox */}
      <Card
        variant="outlined"
        className="bg-amber-50 border-2 border-amber-200 space-y-3"
        hoverEffect={false}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmDetails}
            onChange={(e) => setConfirmDetails(e.target.checked)}
            className="w-5 h-5 rounded-md mt-1 cursor-pointer accent-blue-600"
          />
          <span className="text-sm font-semibold text-gray-900 leading-relaxed">
            I confirm that all the information provided above is accurate and complete.
          </span>
        </label>
        {errors.confirmDetails && (
          <p className="text-red-600 text-sm font-medium ml-8">
            ⚠️ {errors.confirmDetails}
          </p>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t-2 border-gray-100">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onDonate}
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Submitting...
            </>
          ) : (
            <>✓ Submit Donation</>
          )}
        </button>
      </div>
    </Card>
  );
};

export default DonationFormCard;
