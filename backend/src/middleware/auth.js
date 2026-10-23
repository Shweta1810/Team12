import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ message: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'team12-crm'
    });
  } catch {
    return res.status(401).json({ message: 'Session is invalid or expired' });
  }

  if (!payload || typeof payload !== 'object' ||
      typeof payload.sub !== 'string' || !mongoose.isValidObjectId(payload.sub) ||
      !Number.isInteger(payload.ver)) {
    return res.status(401).json({ message: 'Session is invalid or expired' });
  }

  try {
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.tokenVersion !== payload.ver) {
      return res.status(401).json({ message: 'Session is invalid or expired' });
    }
    req.user = user;
  } catch (err) {
    return next(err);
  }

  return next();
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
