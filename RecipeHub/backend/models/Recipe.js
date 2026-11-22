
const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    ingredients: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    steps: {
      type: [String],
      required: true,
    },

    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    cookingTime: {
      type: Number,
      required: true,
      min: 1,
    },

    servings: {
      type: Number,
      default: 1,
      min: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Average rating of recipe
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Total number of reviews
    ratingsCount: {
      type: Number,
      default: 0,
    },

    // Recipe Reviews
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        name: {
          type: String,
          default: "RecipeHub User",
        },

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },

        comment: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Approval workflow: user recipes start as "pending" and become public
    // only after an admin approves them. Admin recipes are approved instantly.
    // Older recipes without this field are treated as approved.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
      maxlength: 500,
    },

    isReported: {
      type: Boolean,
      default: false,
    },

    // Admin moderation: soft removal keeps data recoverable.
    isRemoved: {
      type: Boolean,
      default: false,
      index: true,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    removalReason: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Database Index
recipeSchema.index({ category: 1, createdAt: -1 });

recipeSchema.index({ averageRating: -1 });

module.exports = mongoose.model("Recipe", recipeSchema);
