
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "Inappropriate Content",
        "Incorrect Information",
        "Copyright Violation",
        "Spam",
        "Other",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "removed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// One user can report a particular recipe only once.
reportSchema.index({ recipe: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
