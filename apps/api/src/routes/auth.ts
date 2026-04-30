import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { sendOTP, verifyOTP } from '../services/otp';
import { strictRateLimit, authRateLimit } from '../middleware/rateLimiter';
import { signToken } from '../utils/jwt';
import { prisma } from '@nishabdha/database';
import { requireCustomerAuth } from '../middleware/auth';

const router: ExpressRouter = Router();

const sendOTPSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

const verifyOTPSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
});

// POST /api/auth/send-otp
router.post('/send-otp', strictRateLimit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = sendOTPSchema.parse(req.body);

    await sendOTP(phone);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: { expiresIn: 600 },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', authRateLimit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, otp } = verifyOTPSchema.parse(req.body);

    let isValid: boolean;
    try {
      isValid = await verifyOTP(phone, otp);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('expired') || error.message.includes('not found')) {
          res.status(400).json({
            success: false,
            error: 'OTP expired or not found',
          });
          return;
        }
        if (error.message.includes('Maximum')) {
          res.status(429).json({
            success: false,
            error: 'Maximum OTP attempts exceeded',
          });
          return;
        }
      }
      throw error;
    }

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid OTP',
      });
      return;
    }

    // Find or create customer with atomic upsert
    const customer = await prisma.customer.upsert({
      where: { phone },
      create: {
        phone,
        phoneVerified: true,
      },
      update: {
        phoneVerified: true,
        lastSeenAt: new Date(),
      },
    });

    // Generate JWT token
    const token = signToken({
      customerId: customer.id,
      phone: customer.phone,
      type: 'customer',
    });

    res.json({
      success: true,
      data: {
        token,
        customer: {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', requireCustomerAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      customer: {
        id: req.customer!.id,
        phone: req.customer!.phone,
        name: req.customer!.name,
        email: req.customer!.email,
      },
    },
  });
});

export default router as import("express").Router;
