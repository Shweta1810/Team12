
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Admin", "Sales Staff", "Support Staff"],
      default: "Sales Staff",
    },

    // Sales Staff member assigned to this Support Staff
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: async function (value) {
          if (!value) {
            return this.role !== "Support Staff";
          }

          if (this.role !== "Support Staff") {
            return false;
          }

          const salesStaff = await mongoose.model("User").findOne({
            _id: value,
            role: "Sales Staff",
            status: "Active",
          });

          return !!salesStaff;
        },
        message:
          "Support Staff must be assigned to an active Sales Staff member.",
      },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

