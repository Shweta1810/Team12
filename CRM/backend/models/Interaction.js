const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema(
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

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Interaction = mongoose.model(
  "Interaction",
  interactionSchema
);

module.exports = Interaction;