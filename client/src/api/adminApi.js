// server/api/adminApi.js
import express from "express";
const router = express.Router();

router.get("/dashboard", (req, res) => {
  res.json({
    totalCampaigns: 8,
    totalDonors: 24,
    totalCollected: 17500,
  });
});

export default router;
