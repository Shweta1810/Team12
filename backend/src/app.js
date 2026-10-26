import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import customerRoutes from './routes/customers.js';
import feedbackRoutes from './routes/feedback.js';
import retentionRoutes from './routes/retention.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' }
});
app.use('/api/auth/login', loginLimiter);
app.get('/api/health', (_req, res) => {
  const { readyState } = mongoose.connection;
  if (readyState !== 1) return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  return res.json({ status: 'ok', database: 'connected' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/retention', retentionRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
