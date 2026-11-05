const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const authenticateUser = require("../middleware/auth");

// GET /api/audit-logs
// Only Admin users can view audit logs.
router.get("/", authenticateUser, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admins can view audit logs.",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(),
    ]);

    return res.status(200).json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error.message);

    return res.status(500).json({
      message: "Failed to fetch audit logs.",
    });
  }
});

module.exports = router;