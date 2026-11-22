
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { publicRecipeFilter } = require("../utils/recipeFilters");
const jwt = require("jsonwebtoken");

// Reads the JWT if one is sent, but never fails when it is missing/invalid.
const getOptionalUser = async (req) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
};

// CREATE RECIPE
exports.createRecipe = async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      steps,
      category,
      imageUrl,
      cookingTime,
      servings,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0 ||
      !Array.isArray(steps) ||
      steps.length === 0 ||
      typeof category !== "string" ||
      !category.trim() ||
      !Number.isFinite(Number(cookingTime)) ||
      Number(cookingTime) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid recipe details",
      });
    }

    const isAdmin = req.user.role === "admin";

    // Admin recipes go live immediately; user recipes wait for admin approval.
    const recipe = await Recipe.create({
      title,
      description,
      ingredients,
      steps,
      category,
      imageUrl,
      cookingTime,
      servings,
      createdBy: req.user._id,
      status: isAdmin ? "approved" : "pending",
      reviewedBy: isAdmin ? req.user._id : null,
      reviewedAt: isAdmin ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: isAdmin
        ? "Recipe published successfully"
        : "Recipe submitted! It will appear publicly after admin approval.",
      recipe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL RECIPES: SEARCH + CATEGORY + PAGINATION
exports.getRecipes = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim().toLowerCase();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 9)
    );

    const filter = publicRecipeFilter();

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      const safeSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { "ingredients.name": { $regex: safeSearch, $options: "i" } },
      ];
    }

    const totalRecipes = await Recipe.countDocuments(filter);

    const recipes = await Recipe.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalRecipes,
      currentPage: page,
      totalPages: Math.ceil(totalRecipes / limit),
      recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET AVAILABLE CATEGORIES
exports.getCategories = async (req, res) => {
  try {
    const categories = await Recipe.distinct("category", publicRecipeFilter());

    res.status(200).json({
      success: true,
      categories: categories.sort(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET SINGLE RECIPE
// Public users only see approved recipes. The owner and admins can also open
// their own pending/rejected recipes (and admin can open removed ones).
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("reviews.user", "name");

    let canView = false;

    if (recipe) {
      const isPublic =
        recipe.isRemoved !== true &&
        !["pending", "rejected"].includes(recipe.status);

      canView = isPublic;

      if (!canView) {
        const user = await getOptionalUser(req);
        const ownerId = recipe.createdBy?._id || recipe.createdBy;
        const isOwner =
          user && String(ownerId) === String(user._id) && !recipe.isRemoved;
        canView = Boolean(user && (user.role === "admin" || isOwner));
      }
    }

    if (!recipe || !canView) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    res.status(200).json({
      success: true,
      recipe,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid recipe ID"
          : error.message,
    });
  }
};


// UPDATE RECIPE
exports.updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    const isOwner =
      recipe.createdBy.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this recipe",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "ingredients",
      "steps",
      "category",
      "imageUrl",
      "cookingTime",
      "servings",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        recipe[field] = req.body[field];
      }
    });

    // A user's edit must be approved again before it is public.
    let needsReview = false;
    if (!isAdmin) {
      recipe.status = "pending";
      recipe.rejectionReason = "";
      recipe.reviewedBy = null;
      recipe.reviewedAt = null;
      needsReview = true;
    }

    await recipe.save();

    res.status(200).json({
      success: true,
      message: needsReview
        ? "Recipe updated and sent for admin approval."
        : "Recipe updated successfully",
      recipe,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid recipe ID"
          : error.message,
    });
  }
};


// DELETE RECIPE
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    const isOwner =
      recipe.createdBy.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this recipe",
      });
    }

    await recipe.deleteOne();

    res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid recipe ID"
          : error.message,
    });
  }
};


// ADD RECIPE REVIEW
exports.addRecipeReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (
      typeof comment !== "string" ||
      !comment.trim() ||
      comment.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Please write a review (maximum 500 characters)",
      });
    }

    const recipe = await Recipe.findOne({ _id: req.params.id, ...publicRecipeFilter() });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Check if user already reviewed this recipe
    const existingReview = recipe.reviews.find(
      (review) =>
        review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this recipe",
      });
    }

    // Add new review
    recipe.reviews.push({
      user: req.user._id,
      name: req.user.name || "RecipeHub User",
      rating: numericRating,
      comment: comment.trim(),
    });

    // Calculate average rating
    const totalRatings = recipe.reviews.length;

    const totalStars = recipe.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    recipe.averageRating = Number(
      (totalStars / totalRatings).toFixed(1)
    );

    recipe.ratingsCount = totalRatings;

    await recipe.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      averageRating: recipe.averageRating,
      ratingsCount: recipe.ratingsCount,
      reviews: recipe.reviews,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid recipe ID"
          : error.message,
    });
  }
};


// ADD RECIPE TO FAVOURITES
exports.addFavourite = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ _id: req.params.id, ...publicRecipeFilter() });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyFavourite = user.favourites.some(
      (id) => id.toString() === recipe._id.toString()
    );

    if (alreadyFavourite) {
      return res.status(200).json({
        success: true,
        message: "Recipe is already in favourites",
      });
    }

    user.favourites.push(recipe._id);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Recipe added to favourites",
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid recipe ID"
          : error.message,
    });
  }
};


// REMOVE RECIPE FROM FAVOURITES
exports.removeFavourite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.favourites = user.favourites.filter(
      (id) => id.toString() !== req.params.id
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Recipe removed from favourites",
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET USER FAVOURITE RECIPES
exports.getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favourites",
      match: publicRecipeFilter(),
      populate: {
        path: "createdBy",
        select: "name",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const visibleFavourites = user.favourites.filter(Boolean);

    res.status(200).json({
      success: true,
      totalFavourites: visibleFavourites.length,
      favourites: visibleFavourites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ADMIN: LIST SOFT-REMOVED RECIPES */
exports.getRemovedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ isRemoved: true })
      .populate("createdBy", "name")
      .populate("removedBy", "name")
      .sort({ removedAt: -1 });

    res.status(200).json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ADMIN: RESTORE A RECIPE */
exports.restoreRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, isRemoved: true },
      {
        $set: { isRemoved: false, removedAt: null, removedBy: null, removalReason: "" },
      },
      { new: true, runValidators: true }
    );

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Removed recipe not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recipe restored successfully",
      recipe,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid recipe ID" : error.message,
    });
  }
};


/* USER: LIST MY OWN RECIPES (includes pending / rejected) */
exports.getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      createdBy: req.user._id,
      isRemoved: { $ne: true },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ADMIN: LIST ALL RECIPES (any status) WITH FILTERS */
exports.getAdminRecipes = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();

    const filter = {};

    if (status === "removed") {
      filter.isRemoved = true;
    } else if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
      filter.isRemoved = { $ne: true };
    }

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }

    const recipes = await Recipe.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({ success: true, count: recipes.length, recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ADMIN: APPROVE A PENDING RECIPE */
exports.approveRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, isRemoved: { $ne: true } },
      {
        $set: {
          status: "approved",
          rejectionReason: "",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    res.status(200).json({
      success: true,
      message: "Recipe approved and now public.",
      recipe,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid recipe ID" : error.message,
    });
  }
};


/* ADMIN: REJECT A PENDING RECIPE (with reason shown to the owner) */
exports.rejectRecipe = async (req, res) => {
  try {
    const reason = String(req.body.reason || "").trim().slice(0, 500);

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please give a reason so the author can fix the recipe.",
      });
    }

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, isRemoved: { $ne: true } },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason,
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    res.status(200).json({
      success: true,
      message: "Recipe rejected.",
      recipe,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid recipe ID" : error.message,
    });
  }
};


/* ADMIN: SOFT-REMOVE ANY RECIPE DIRECTLY */
exports.removeRecipe = async (req, res) => {
  try {
    const reason = String(req.body.reason || "").trim().slice(0, 500);

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, isRemoved: { $ne: true } },
      {
        $set: {
          isRemoved: true,
          removedAt: new Date(),
          removedBy: req.user._id,
          removalReason: reason || "Removed by administrator",
        },
      },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    res.status(200).json({
      success: true,
      message: "Recipe removed. You can restore it from the Removed tab.",
      recipe,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid recipe ID" : error.message,
    });
  }
};
