import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { sendEmailOTP, verifyEmailOTP, cleanupSupabaseUser } from '../services/emailOtp';
import { strictRateLimit, authRateLimit } from '../middleware/rateLimiter';
import { signToken } from '../utils/jwt';
import { prisma } from '@nishabdha/database';
import { requireCustomerAuth } from '../middleware/auth';

const router: ExpressRouter = Router();

const sendEmailOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyEmailOTPSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6, 'OTP must be at least 6 characters').max(8, 'OTP must be at most 8 characters'),
});

// POST /api/auth/email/send-otp
router.post('/send-otp', strictRateLimit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = sendEmailOTPSchema.parse(req.body);

    await sendEmailOTP(email);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        email,
        expiresIn: 3600, // Supabase OTPs expire in 1 hour
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/email/verify-otp
router.post('/verify-otp', authRateLimit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, token } = verifyEmailOTPSchema.parse(req.body);

    // Verify OTP with Supabase
    let supabaseUser;
    try {
      supabaseUser = await verifyEmailOTP(email, token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          res.status(400).json({
            success: false,
            error: 'Invalid or expired OTP',
          });
          return;
        }
      }
      throw error;
    }

    // Find or create customer with atomic upsert
    let customer;
    try {
      customer = await prisma.customer.upsert({
        where: { email },
        create: {
          email,
          emailVerified: true,
          supabaseUid: supabaseUser.userId,
          // Phone is optional for email-based auth
          phone: `email_${supabaseUser.userId.slice(0, 10)}`, // Placeholder to satisfy unique constraint
        },
        update: {
          emailVerified: true,
          supabaseUid: supabaseUser.userId,
          lastSeenAt: new Date(),
        },
      });
    } catch (dbError) {
      // If customer creation fails, cleanup the Supabase user
      await cleanupSupabaseUser(supabaseUser.userId);
      throw dbError;
    }

    // Generate JWT token
    const jwtToken = signToken({
      customerId: customer.id,
      email: customer.email!,
      type: 'customer',
    });

    res.json({
      success: true,
      data: {
        token: jwtToken,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/email/me
router.get('/me', requireCustomerAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      customer: {
        id: req.customer!.id,
        email: req.customer!.email,
        name: req.customer!.name,
        phone: req.customer!.phone,
      },
    },
  });
});

export default router;
