import mongoose from 'mongoose';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Resource not found' });
}
export function errorHandler(err, _req, res, _next) {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON request body' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large' });
  if (err?.name === 'ValidationError') return res.status(400).json({ message: 'Invalid input' });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid input' });
  if (err?.code === 11000) return res.status(409).json({ message: 'An account with that email already exists' });
  if (mongooseUnavailable(err)) return res.status(503).json({ message: 'Database unavailable' });
  console.error('Request failed');
  res.status(500).json({ message: 'Internal server error' });
}

function mongooseUnavailable(err) {
  return mongoose.connection.readyState !== 1 ||
    err?.name === 'MongoServerSelectionError' ||
    err?.name === 'MongoNetworkError' ||
    err?.name === 'MongoNotConnectedError';
}
