import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
const roles = ['Admin', 'Sales Staff', 'Support Staff'];
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(requireAuth, allowRoles('Admin'));

router.get('/', async (_req, res, next) => {
  try {
    const users = await User.find().select('name email role isActive createdAt updatedAt').sort({ createdAt: -1 }).lean();
    res.json({ users: users.map(({ _id, ...user }) => ({ id: _id.toString(), ...user })) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100 ||
        typeof email !== 'string' || !validEmail.test(email) ||
        typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72 ||
        !roles.includes(role)) {
      return res.status(400).json({ message: 'Provide a name, valid email, password (12+ characters and at most 72 UTF-8 bytes), and valid role' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role });
    await audit('USER_CREATED', req.user._id, user._id, { role });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'role', 'isActive'];
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) ||
        Object.keys(req.body).some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({ message: 'Invalid account changes' });
    }
    if (req.body?.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim().length < 2 || req.body.name.trim().length > 100)
        return res.status(400).json({ message: 'Invalid name' });
      updates.name = req.body.name.trim();
    }
    if (req.body?.role !== undefined) {
      if (!roles.includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
      if (req.body.role !== req.user.role) {
        if (req.params.id === req.user._id.toString())
          return res.status(400).json({ message: 'You cannot change your own role' });
        updates.role = req.body.role;
      }
    }
    if (req.body?.isActive !== undefined) {
      if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'Invalid account status' });
      if (req.body.isActive === false && req.params.id === req.user._id.toString())
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      if (req.body.isActive !== req.user.isActive || req.params.id !== req.user._id.toString()) {
        updates.isActive = req.body.isActive;
      }
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid changes provided' });
    const invalidateTokens = updates.isActive === false || updates.role !== undefined;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates, ...(invalidateTokens ? { $inc: { tokenVersion: 1 } } : {}) },
      { new: true, runValidators: true }
    ).select('name email role isActive');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await audit('USER_UPDATED', req.user._id, user._id, { changedFields: Object.keys(updates) });
    res.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) { next(err); }
});

export default router;
