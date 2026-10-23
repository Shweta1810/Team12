import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must contain at least 32 characters');
  process.exit(1);
}
const port = Number(process.env.PORT || 4000);
try {
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`CRM API listening on port ${port}`));
} catch {
  console.error('Unable to connect to the database');
  process.exit(1);
}
