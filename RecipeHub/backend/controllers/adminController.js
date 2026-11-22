const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Report = require("../models/Report");
const MealPlan = require("../models/MealPlan");

// ADMIN: DASHBOARD OVERVIEW NUMBERS
exports.getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      totalRecipes,
      pendingRecipes,
      rejectedRecipes,
      removedRecipes,
      pendingReports,
      totalReports,
      mealPlans,
      categoryBreakdown,
      topRecipes,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", createdAt: { $gte: sevenDaysAgo } }),
      Recipe.countDocuments({
        isRemoved: { $ne: true },
        status: { $nin: ["pending", "rejected"] },
      }),
      Recipe.countDocuments({ isRemoved: { $ne: true }, status: "pending" }),
      Recipe.countDocuments({ isRemoved: { $ne: true }, status: "rejected" }),
      Recipe.countDocuments({ isRemoved: true }),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments(),
      MealPlan.countDocuments(),
      Recipe.aggregate([
        {
          $match: {
            isRemoved: { $ne: true },
            status: { $nin: ["pending", "rejected"] },
          },
        },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Recipe.find({
        isRemoved: { $ne: true },
        status: { $nin: ["pending", "rejected"] },
        ratingsCount: { $gt: 0 },
      })
        .select("title imageUrl averageRating ratingsCount")
        .sort({ averageRating: -1, ratingsCount: -1 })
        .limit(5),
      User.find({ role: "user" })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        newUsers,
        totalRecipes,
        pendingRecipes,
        rejectedRecipes,
        removedRecipes,
        pendingReports,
        totalReports,
        mealPlans,
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      topRecipes,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: LIST USERS WITH RECIPE COUNTS
exports.getUsers = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = {};

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const counts = await Recipe.aggregate([
      { $match: { createdBy: { $in: users.map((u) => u._id) } } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        ...u,
        recipeCount: countMap.get(String(u._id)) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
