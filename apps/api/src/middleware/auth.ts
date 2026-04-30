import { Request, Response, NextFunction } from 'express';
import type { Customer, Admin } from '@nishabdha/database';
import { verifyToken, CustomerTokenPayload } from '../utils/jwt';
import { prisma } from '@nishabdha/database';
import { supabaseAdmin } from '../utils/supabase';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      customer?: Customer;
      admin?: Admin;
    }
  }
}

export async function requireCustomerAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const payload = verifyToken(token) as CustomerTokenPayload;

    if (payload.type !== 'customer') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: payload.customerId },
    });

    if (!customer) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Customer not found',
      });
      return;
    }

    // Update last seen
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastSeenAt: new Date() },
    });

    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
}

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify Supabase JWT
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    }

    // Fetch admin record from database
    const admin = await prisma.admin.findUnique({
      where: { supabaseUid: user.id },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin not found',
      });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}
