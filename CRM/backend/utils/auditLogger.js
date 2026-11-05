const AuditLog = require("../models/AuditLog");

async function createAuditLog({
  user = null,
  username = "System",
  userRole = "Unknown",
  action,
  module,
  description,
  targetId = null,
  status = "SUCCESS",
  ipAddress = null,
}) {
  try {
    await AuditLog.create({
      user,
      username,
      userRole,
      action,
      module,
      description,
      targetId: targetId ? String(targetId) : null,
      status,
      ipAddress,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error.message);
  }
}

module.exports = { createAuditLog };