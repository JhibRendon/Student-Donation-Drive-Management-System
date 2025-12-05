import mongoose from "mongoose";

const reportStorageSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true,
  },
  reportType: {
    type: String,
    enum: ["donations", "campaigns"],
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  adminName: String,
  pdfData: {
    type: String, // Base64 encoded PDF
    required: true,
  },
  metadata: {
    totalPages: Number,
    generatedDate: Date,
    dateRange: {
      startDate: Date,
      endDate: Date,
    },
    filters: mongoose.Schema.Types.Mixed,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: Number,
  status: {
    type: String,
    enum: ["active", "archived", "deleted"],
    default: "active",
  },
  accessLog: [
    {
      accessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      accessedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
});

// Auto-delete expired reports
reportStorageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("ReportStorage", reportStorageSchema);
