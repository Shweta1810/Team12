const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Lead name is required."],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) =>
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
        message: "Please enter a valid email address.",
      },
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      validate: {
        validator: (value) => /^\d{10}$/.test(value),
        message: "Phone number must contain exactly 10 digits.",
      },
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
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;