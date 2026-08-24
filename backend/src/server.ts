import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connection.js';
import { router as screenRouter } from './routes/screen.routes.js';
import { authRouter } from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', screenRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server immediately and connect DB in background
app.listen(PORT, () => {
  console.log(`Smart Resume Backend server running on http://localhost:${PORT}`);
  connectDB().catch((err) => console.error('Database connection error:', err));
});
