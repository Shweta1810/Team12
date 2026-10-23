import AuditLog from '../models/AuditLog.js';

export async function audit(action, userId = null, targetUserId = null, metadata = {}) {
  try {
    // Never pass credentials, passwords, JWTs, or secrets in metadata.
    await AuditLog.create({ action, userId, targetUserId, metadata });
  } catch (err) {
    // Do not leak details to the client. Server logs only a generic event.
    console.error('Audit event could not be persisted');
  }
}
