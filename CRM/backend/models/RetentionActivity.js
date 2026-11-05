const mongoose = require("mongoose");

const retentionActivitySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "Follow-up",
        "Special Offer",
        "Loyalty Reward",
        "Feedback Review",
        "Check-in",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Planned",
        "Completed",
        "Cancelled",
      ],
      default: "Planned",
    },
  },
  {
    timestamps: true,
  }
);

const RetentionActivity = mongoose.model(
  "RetentionActivity",
  retentionActivitySchema
);

module.exports = RetentionActivity;