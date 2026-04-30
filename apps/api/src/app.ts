import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler, notFound } from './middleware';
import { requestLogger } from './middleware/logger';
import { apiRateLimit } from './middleware/rateLimiter';
import { prisma } from '@nishabdha/database';
import { redisHealthCheck } from './utils/redis';
import authRoutes from './routes/auth';
import emailAuthRoutes from './routes/emailAuth';
import adminRoutes from './routes/admin';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import addressRoutes from './routes/addresses';
import orderRoutes from './routes/orders';
import customerRoutes from './routes/customers';
import studioBookingRoutes from './routes/studioBookings';
import studioSpaceRoutes from './routes/studioSpaces';

const app: Express = express();

app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  maxAge: 86400,
}));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', apiRateLimit);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisHealthy = await redisHealthCheck();

    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        database: 'connected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    const redisHealthy = await redisHealthCheck();

    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        database: 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
      error: 'Service Unavailable',
    });
  }
});

// API routes
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Nishabdha API',
    data: {
      version: '1.0.0',
      endpoints: ['/health', '/api'],
    },
  });
});

// Auth routes
app.use('/api/auth', authRoutes); // Phone-based OTP auth (SMS)
app.use('/api/auth/email', emailAuthRoutes); // Email-based OTP auth (Supabase)

// Product routes
app.use('/api/products', productRoutes);

// Cart routes
app.use('/api/cart', cartRoutes);

// Address routes
app.use('/api/addresses', addressRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Customer routes (admin only)
app.use('/api/customers', customerRoutes);

// Studio booking routes (admin only)
app.use('/api/studio-bookings', studioBookingRoutes);

// Studio space routes (admin only)
app.use('/api/studio-spaces', studioSpaceRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
