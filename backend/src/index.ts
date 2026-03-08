import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import questionsRouter from './routes/questions';
import analysisRouter from './routes/analysis';
import sessionsRouter from './routes/sessions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/questions', questionsRouter);
app.use('/api/analyze-answer', analysisRouter);
app.use('/api/sessions', sessionsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Interview Coach API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/questions?category=<cs_ops|tech_support|behavioral>&lastId=<optional>`);
  console.log(`   GET  /api/questions/categories`);
  console.log(`   POST /api/analyze-answer`);
  console.log(`   GET  /api/sessions`);
  console.log(`   POST /api/sessions`);
  console.log(`   GET  /api/sessions/:id`);
});
