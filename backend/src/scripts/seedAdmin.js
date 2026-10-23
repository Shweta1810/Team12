import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error('Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in .env');
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters');
  process.exit(1);
}
if (Buffer.byteLength(process.env.ADMIN_PASSWORD, 'utf8') > 72) {
  console.error('ADMIN_PASSWORD must not exceed 72 UTF-8 bytes');
  process.exit(1);
}
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('ADMIN_EMAIL must be a valid email address');
  process.exit(1);
}
const adminName = (process.env.ADMIN_NAME || 'CRM Administrator').trim();
if (adminName.length < 2 || adminName.length > 100) {
  console.error('ADMIN_NAME must contain 2 to 100 characters');
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('An account with ADMIN_EMAIL already exists; no changes made.');
  } else {
    await User.create({
      name: adminName,
      email,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      role: 'Admin'
    });
    console.log('Initial admin account created. Sign in and change the seed password if appropriate.');
  }
} catch {
  console.error('Could not seed admin account. Check database configuration.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
