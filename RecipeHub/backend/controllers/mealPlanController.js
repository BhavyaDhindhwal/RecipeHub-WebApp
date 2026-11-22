
const MealPlan = require("../models/MealPlan");
const Recipe = require("../models/Recipe");
const { publicRecipeFilter } = require("../utils/recipeFilters");

// Allowed meal categories
const allowedMealTypes = ["breakfast", "lunch", "snacks", "dinner"];

// GET WEEKLY MEAL PLAN
exports.getMealPlan = async (req, res) => {
  try {
    const { weekStart } = req.query;

    if (!weekStart) {
      return res.status(400).json({
        success: false,
        message: "weekStart is required",
      });
    }

    const mealPlan = await MealPlan.findOne({
      user: req.user._id,
      weekStart,
    }).populate([
      { path: "meals.breakfast.recipe", match: publicRecipeFilter(), select: "title imageUrl category cookingTime servings averageRating ingredients" },
      { path: "meals.lunch.recipe", match: publicRecipeFilter(), select: "title imageUrl category cookingTime servings averageRating ingredients" },
      { path: "meals.snacks.recipe", match: publicRecipeFilter(), select: "title imageUrl category cookingTime servings averageRating ingredients" },
      { path: "meals.dinner.recipe", match: publicRecipeFilter(), select: "title imageUrl category cookingTime servings averageRating ingredients" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Weekly meal plan fetched successfully",
      mealPlan: mealPlan || {
        user: req.user._id,
        weekStart,
        meals: [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meal plan",
      error: error.message,
    });
  }
};

// ADD RECIPE TO MEAL PLAN
exports.addMeal = async (req, res) => {
  try {
    const { weekStart, date, mealType, recipeId } = req.body;

    if (!weekStart || !date || !mealType || !recipeId) {
      return res.status(400).json({
        success: false,
        message: "weekStart, date, mealType and recipeId are required",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    if (!allowedMealTypes.includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meal type",
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const recipe = await Recipe.findOne({ _id: recipeId, ...publicRecipeFilter() });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    let mealPlan = await MealPlan.findOne({
      user: req.user._id,
      weekStart,
    });

    if (!mealPlan) {
      mealPlan = new MealPlan({
        user: req.user._id,
        weekStart,
        meals: [],
      });
    }

    let dailyMeal = mealPlan.meals.find(
      (meal) => meal.date === date
    );

    if (!dailyMeal) {
      dailyMeal = { date };
      mealPlan.meals.push(dailyMeal);
      dailyMeal = mealPlan.meals[mealPlan.meals.length - 1];
    }

    const selectedMeals = dailyMeal[mealType];

    const alreadyAdded = selectedMeals.some(
      (item) => item.recipe.toString() === recipeId
    );

    if (alreadyAdded) {
      return res.status(409).json({
        success: false,
        message: "This recipe is already added to this meal",
      });
    }

    selectedMeals.push({ recipe: recipeId });

    await mealPlan.save();

    return res.status(201).json({
      success: true,
      message: "Recipe added to meal plan successfully",
      mealPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add recipe to meal plan",
      error: error.message,
    });
  }
};

// REMOVE RECIPE FROM MEAL PLAN
exports.removeMeal = async (req, res) => {
  try {
    const { weekStart, date, mealType, recipeId } = req.body;

    if (!weekStart || !date || !mealType || !recipeId) {
      return res.status(400).json({
        success: false,
        message: "weekStart, date, mealType and recipeId are required",
      });
    }

    if (!allowedMealTypes.includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meal type",
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const mealPlan = await MealPlan.findOne({
      user: req.user._id,
      weekStart,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    const dailyMeal = mealPlan.meals.find(
      (meal) => meal.date === date
    );

    if (!dailyMeal) {
      return res.status(404).json({
        success: false,
        message: "Day not found in meal plan",
      });
    }

    const oldLength = dailyMeal[mealType].length;

    dailyMeal[mealType] = dailyMeal[mealType].filter(
      (item) => item.recipe.toString() !== recipeId
    );

    if (dailyMeal[mealType].length === oldLength) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found in this meal",
      });
    }

    await mealPlan.save();

    return res.status(200).json({
      success: true,
      message: "Recipe removed from meal plan successfully",
      mealPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove recipe from meal plan",
      error: error.message,
    });
  }
};


// COPY ONE DAY'S MEALS TO ANOTHER DAY (same week)
exports.copyDay = async (req, res) => {
  try {
    const { weekStart, fromDate, toDate } = req.body;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;

    if (![weekStart, fromDate, toDate].every((d) => dateRe.test(d || ""))) {
      return res.status(400).json({
        success: false,
        message: "weekStart, fromDate and toDate (YYYY-MM-DD) are required",
      });
    }

    if (fromDate === toDate) {
      return res.status(400).json({
        success: false,
        message: "Choose a different day to copy to",
      });
    }

    const mealPlan = await MealPlan.findOne({ user: req.user._id, weekStart });
    const source = mealPlan?.meals.find((m) => m.date === fromDate);

    if (!mealPlan || !source) {
      return res.status(404).json({
        success: false,
        message: "Nothing planned on that day to copy",
      });
    }

    let target = mealPlan.meals.find((m) => m.date === toDate);
    if (!target) {
      mealPlan.meals.push({ date: toDate });
      target = mealPlan.meals[mealPlan.meals.length - 1];
    }

    allowedMealTypes.forEach((type) => {
      source[type].forEach((item) => {
        const exists = target[type].some(
          (t) => t.recipe.toString() === item.recipe.toString()
        );
        if (!exists) target[type].push({ recipe: item.recipe });
      });
    });

    await mealPlan.save();

    return res.status(200).json({
      success: true,
      message: "Day copied successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to copy day",
      error: error.message,
    });
  }
};

// CLEAR ALL MEALS OF ONE DAY
exports.clearDay = async (req, res) => {
  try {
    const { weekStart, date } = req.body;

    if (!weekStart || !date) {
      return res.status(400).json({
        success: false,
        message: "weekStart and date are required",
      });
    }

    const mealPlan = await MealPlan.findOne({ user: req.user._id, weekStart });

    if (!mealPlan) {
      return res.status(200).json({ success: true, message: "Day is already empty" });
    }

    mealPlan.meals = mealPlan.meals.filter((m) => m.date !== date);
    await mealPlan.save();

    return res.status(200).json({
      success: true,
      message: "Day cleared successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear day",
      error: error.message,
    });
  }
};
