
const express = require("express");
const router = express.Router();

const {
  createRecipe,
  getRecipes,
  getCategories,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  addRecipeReview,
  addFavourite,
  removeFavourite,
  getFavourites,
  getRemovedRecipes,
  restoreRecipe,
  getMyRecipes,
  getAdminRecipes,
  approveRecipe,
  rejectRecipe,
  removeRecipe,
} = require("../controllers/recipeController");

const { protect, adminOnly } = require("../middleware/authMiddleware");


// PUBLIC ROUTES
router.get("/", getRecipes);
router.get("/categories", getCategories);


// ADMIN MODERATION ROUTES (must be before /:id)
router.get("/admin/all", protect, adminOnly, getAdminRecipes);
router.get("/removed", protect, adminOnly, getRemovedRecipes);
router.patch("/:id/approve", protect, adminOnly, approveRecipe);
router.patch("/:id/reject", protect, adminOnly, rejectRecipe);
router.patch("/:id/remove", protect, adminOnly, removeRecipe);
router.patch("/:id/restore", protect, adminOnly, restoreRecipe);

// FAVOURITE ROUTES
// Keep GET /favourites before GET /:id
router.get("/favourites", protect, getFavourites);
router.get("/mine", protect, getMyRecipes);
router.post("/:id/favourite", protect, addFavourite);
router.delete("/:id/favourite", protect, removeFavourite);


// SINGLE RECIPE
router.get("/:id", getRecipeById);


// PROTECTED RECIPE ROUTES
router.post("/", protect, createRecipe);
router.put("/:id", protect, updateRecipe);
router.delete("/:id", protect, deleteRecipe);


// RATING AND REVIEW
router.post("/:id/reviews", protect, addRecipeReview);


module.exports = router;
