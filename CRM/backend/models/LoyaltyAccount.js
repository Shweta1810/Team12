const mongoose = require("mongoose");

const loyaltyAccountSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },

    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const LoyaltyAccount = mongoose.model(
  "LoyaltyAccount",
  loyaltyAccountSchema
);

module.exports = LoyaltyAccount;