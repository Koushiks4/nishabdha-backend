import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        tls: {},
      });

      this.instance.on('connect', () => {
        logger.info('Redis connected');
      });

      this.instance.on('error', (err) => {
        logger.error('Redis error:', err);
      });
    }

    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
      logger.info('Redis disconnected');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const client = this.getInstance();
      await client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

export const redis = RedisClient.getInstance();

export async function disconnectRedis(): Promise<void> {
  return RedisClient.disconnect();
}

export async function redisHealthCheck(): Promise<boolean> {
  return RedisClient.healthCheck();
}
