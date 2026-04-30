import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@nishabdha/database';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Validation schema for creating bookings
const createBookingSchema = z.object({
  studioType: z.string(),
  duration: z.string(),
  preferredDate: z.string(),
  preferredTime: z.string().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email(),
});

// GET /api/studio-bookings/spaces - Get available studio spaces (public)
router.get('/spaces', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const spaces = await prisma.studioSpace.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        features: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: { spaces },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/studio-bookings - Create new booking (public)
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createBookingSchema.parse(req.body);

    // Find the studio space by name/type
    const space = await prisma.studioSpace.findFirst({
      where: {
        OR: [
          { name: { contains: validatedData.studioType, mode: 'insensitive' } },
          { slug: validatedData.studioType.toLowerCase().replace(/\s+/g, '-') },
        ],
      },
    });

    if (!space) {
      res.status(400).json({
        success: false,
        error: 'Invalid studio type',
      });
      return;
    }

    // Create the booking
    const booking = await prisma.studioBooking.create({
      data: {
        spaceId: space.id,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        preferredDate: new Date(validatedData.preferredDate),
        preferredTime: validatedData.preferredTime,
        duration: validatedData.duration,
        service: validatedData.studioType,
        status: 'PENDING',
      },
      include: {
        space: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Booking request submitted successfully. Our team will contact you soon.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
      return;
    }
    next(error);
  }
});

// GET /api/studio-bookings - Get all bookings (admin only)
router.get('/', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '50', offset = '0', status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'undefined') {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.studioBooking.findMany({
        where,
        include: {
          space: true,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(String(limit)),
        skip: parseInt(String(offset)),
      }),
      prisma.studioBooking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/studio-bookings/:id - Get single booking (admin only)
router.get('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await prisma.studioBooking.findUnique({
      where: { id },
      include: {
        space: true,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/studio-bookings/:id - Update booking (admin only)
router.patch('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const booking = await prisma.studioBooking.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
});

export default router as import("express").Router;
