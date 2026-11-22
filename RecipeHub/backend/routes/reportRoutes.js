const express = require("express");
const router = express.Router();

const {
  createReport,
  getReports,
  updateReportStatus,
  takeReportAction,
} = require("../controllers/reportController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Authenticated users can report a public recipe.
router.post("/:recipeId", protect, createReport);

// Admin-only moderation endpoints.
router.get("/", protect, adminOnly, getReports);
router.patch("/:id/status", protect, adminOnly, updateReportStatus);
router.patch("/:id/action", protect, adminOnly, takeReportAction);

module.exports = router;
