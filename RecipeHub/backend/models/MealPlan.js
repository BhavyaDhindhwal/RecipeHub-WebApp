
const mongoose = require("mongoose");

const mealItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
  },
  { _id: false }
);

const dailyMealSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },

    breakfast: [mealItemSchema],
    lunch: [mealItemSchema],
    snacks: [mealItemSchema],
    dinner: [mealItemSchema],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    weekStart: {
      type: String,
      required: true,
    },

    meals: [dailyMealSchema],
  },
  { timestamps: true }
);

// One weekly plan per user
mealPlanSchema.index(
  { user: 1, weekStart: 1 },
  { unique: true }
);

module.exports = mongoose.model("MealPlan", mealPlanSchema);
