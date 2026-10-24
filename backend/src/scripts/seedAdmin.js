import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
console.error('Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in .env');
process.exit(1);
}

if (process.env.ADMIN_PASSWORD.length < 12 || Buffer.byteLength(process.env.ADMIN_PASSWORD, 'utf8') > 72) {
console.error('ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes');
process.exit(1);
}

try {
await mongoose.connect(process.env.MONGODB_URI);

const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

const admin = await User.findOneAndUpdate(
{ email },
{
$set: {
passwordHash,
isActive: true
}
},
{ new: true, runValidators: true }
).select('+passwordHash');

if (!admin) {
console.error('Admin account not found. No account was changed.');
process.exitCode = 1;
} else {
console.log('Admin password updated successfully.');
console.log(`Admin email: ${admin.email}`);
}
} catch (error) {
console.error('Failed to update admin password:', error.message);
process.exitCode = 1;
} finally {
await mongoose.disconnect();
}
