import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';

import questionsRouter from './routes/questions';
import analysisRouter from './routes/analysis';
import sessionsRouter from './routes/sessions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PRODUCTION_FRONTEND_ORIGIN = 'https://griffin-hall.github.io';
const isProduction = process.env.NODE_ENV === 'production';
const configuredCorsOrigin = process.env.CORS_ALLOWED_ORIGIN?.trim();

if (isProduction) {
  if (!configuredCorsOrigin) {
    throw new Error('CORS_ALLOWED_ORIGIN is required in production.');
  }

  if (configuredCorsOrigin !== PRODUCTION_FRONTEND_ORIGIN) {
    throw new Error(
      `CORS_ALLOWED_ORIGIN must be "${PRODUCTION_FRONTEND_ORIGIN}" in production.`
    );
  }
}

const allowedOrigins = isProduction
  ? [configuredCorsOrigin as string]
  : [
      PRODUCTION_FRONTEND_ORIGIN,
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, health checks) with no Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const corsError = new Error(`CORS blocked for origin: ${origin}`) as Error & {
      status?: number;
    };
    corsError.status = 403;
    callback(corsError);
  }
};

// Enable CORS
app.use(cors(corsOptions));

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
  const status = (err as Error & { status?: number }).status || 500;
  console.error('Server error:', err);
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message
  });
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
