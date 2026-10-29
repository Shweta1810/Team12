const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    username: {
      type: String,
      default: "System",
    },

    userRole: {
      type: String,
      default: "Unknown",
    },

    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGIN_FAILED",
        "LOGOUT",
        "CREATE",
        "UPDATE",
        "DELETE",
        "CONVERT",
        "APPROVE",
        "REJECT",
      ],
    },

    module: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    targetId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },

    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);