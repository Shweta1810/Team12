import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!emailPattern.test(email) || email.length > 254 ||
        !password || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Enter a valid email and password' });
    }
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      await audit('LOGIN_FAILED', user?._id ?? null, null, { email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, ver: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30m', issuer: 'team12-crm' }
    );
    await audit('LOGIN_SUCCESS', user._id);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    req.user.tokenVersion += 1;
    await req.user.save();
    await audit('LOGOUT', req.user._id);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

export default router;
