
const Report = require("../models/Report");
const Recipe = require("../models/Recipe");
const { publicRecipeFilter } = require("../utils/recipeFilters");

// User reports a recipe
exports.createReport = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const { recipeId } = req.params;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please select a report reason",
      });
    }

    const recipe = await Recipe.findOne({ _id: recipeId, ...publicRecipeFilter() });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    const report = await Report.create({
      recipe: recipeId,
      reportedBy: req.user._id || req.user.id,
      reason,
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Recipe reported successfully",
      report,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this recipe",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin gets all reports
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("recipe", "title imageUrl category isRemoved")
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin updates report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status",
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report status updated",
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ADMIN: DISMISS A REPORT OR REMOVE ITS RECIPE */
exports.takeReportAction = async (req, res) => {
  try {
    const { action } = req.body;

    if (!["remove", "dismiss"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be remove or dismiss",
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      await report.save();
      return res.status(200).json({
        success: true,
        message: "Report dismissed. Recipe remains visible.",
        report,
      });
    }

    const recipe = await Recipe.findById(report.recipe);
    if (!recipe) {
      report.status = "removed";
      await report.save();
      return res.status(200).json({
        success: true,
        message: "Recipe was already unavailable; report marked removed.",
        report,
      });
    }

    recipe.isRemoved = true;
    recipe.removedAt = new Date();
    recipe.removedBy = req.user._id;
    recipe.removalReason = report.description || report.reason;
    await recipe.save();

    // Mark every report for this recipe as actioned.
    await Report.updateMany(
      { recipe: recipe._id, status: "pending" },
      { $set: { status: "removed" } }
    );

    const updatedReport = await Report.findById(report._id)
      .populate("recipe", "title imageUrl category isRemoved")
      .populate("reportedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Recipe removed from public listings. Admin can restore it later.",
      report: updatedReport,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid report ID" : error.message,
    });
  }
};
