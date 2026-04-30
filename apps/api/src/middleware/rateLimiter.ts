import rateLimit from 'express-rate-limit';
import RedisStore, { type RedisReply } from 'rate-limit-redis';
import { redis } from '../utils/redis';
import type { Request } from 'express';

// Helper to normalize IPv6 addresses (express-rate-limit v8.4+ requirement)
function normalizeIp(ip: string | undefined): string {
  if (!ip) return 'unknown';

  // Convert IPv4-mapped IPv6 to IPv4 (::ffff:192.0.2.1 -> 192.0.2.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  // Normalize IPv6 to /64 subnet to prevent bypass
  if (ip.includes(':')) {
    const parts = ip.split(':');
    // Keep first 4 groups (64 bits) for IPv6 subnet
    return parts.slice(0, 4).join(':') + '::/64';
  }

  return ip;
}

export function createRateLimiter(
  windowMs: number,
  maxRequests: number,
  prefix: string,
  keyGenerator?: (req: Request) => string
) {
  return rateLimit({
    windowMs,
    max: maxRequests,
    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        redis.call(args[0], ...args.slice(1)) as Promise<RedisReply>,
      prefix,
    }),
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    },
  });
}

// Preset rate limiters

// NOTE: This rate limiter must be applied AFTER body parsing middleware
// in route handlers to access req.body.phone. Do not apply at app-level.
export const strictRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5,              // 5 requests
  'rl:strict:',
  (req) => {
    // Key by phone number for OTP endpoints
    const phone = req.body?.phone;
    return phone || normalizeIp(req.ip);
  }
);

export const authRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10,             // 10 requests
  'rl:auth:'
);

export const apiRateLimit = createRateLimiter(
  60 * 1000,      // 1 minute
  100,            // 100 requests
  'rl:api:'
);
