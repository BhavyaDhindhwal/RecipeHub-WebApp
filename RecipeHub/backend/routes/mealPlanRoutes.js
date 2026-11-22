
const express = require("express");
const router = express.Router();

const {
  getMealPlan,
  addMeal,
  removeMeal,
  copyDay,
  clearDay,
} = require("../controllers/mealPlanController");

const { protect } = require("../middleware/authMiddleware");

// All Meal Planner routes require login
router.use(protect);

// GET weekly meal plan
router.get("/", getMealPlan);

// ADD recipe to a meal
router.post("/add", addMeal);

// REMOVE recipe from a meal
router.delete("/remove", removeMeal);

// COPY one day's meals to another day
router.post("/copy-day", copyDay);

// CLEAR all meals of a day
router.delete("/clear-day", clearDay);

module.exports = router;
