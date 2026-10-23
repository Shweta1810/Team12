const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      enum: [
        "Website",
        "Social Media",
        "Referral",
        "Advertisement",
        "Campaign",
        "Other",
      ],
      default: "Other",
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Converted",
        "Lost",
      ],
      default: "New",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Reason recorded when a lead is marked as Lost (CRM-F-021)
    lostReason: {
      type: String,
      trim: true,
    },

    // Customer created from (or linked to) this lead on conversion
    convertedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;