import app from './app';
import { config } from './config';
import { prisma } from '@nishabdha/database';
import { logger } from './utils/logger';
import { disconnectRedis } from './utils/redis';

const PORT = config.port;
const SHUTDOWN_TIMEOUT = 10000;

const server = app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  const shutdownTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });

    await prisma.$disconnect();
    logger.info('Prisma disconnected');

    await disconnectRedis();

    clearTimeout(shutdownTimer);
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
