const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
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
        "Call",
        "Email",
        "Meeting",
        "Chat",
        "Other",
      ],
      required: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Scheduled",
        "Completed",
        "Rescheduled",
        "Overdue",
      ],
      default: "Scheduled",
    },
  },
  {
    timestamps: true,
  }
);

const FollowUp = mongoose.model(
  "FollowUp",
  followUpSchema
);

module.exports = FollowUp;