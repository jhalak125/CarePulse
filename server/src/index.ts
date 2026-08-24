import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.js';
import apiRouter from './routes/index.js';
import { startBackgroundJobs } from './jobs/scheduler.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (!req.path.startsWith('/health')) {
    logger.info(`${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start server and background workers
app.listen(ENV.PORT, () => {
  logger.success(`🚀 CarePulse Healthcare Backend running at http://localhost:${ENV.PORT}`);
  logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
  logger.info(`🗄️ Database: ${ENV.DATABASE_URL.startsWith('file:') ? 'SQLite (Embedded)' : 'PostgreSQL'}`);
  
  // Start background cron jobs
  startBackgroundJobs();
});

export default app;
