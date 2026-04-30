import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@nishabdha/database';
import { requireCustomerAuth } from '../middleware/auth';

const router = Router();

// Validation schema
const createAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

const updateAddressSchema = createAddressSchema.partial();

// POST /api/addresses - Create address
router.post('/', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createAddressSchema.parse(req.body);
    const customerId = req.customer!.id;

    // If this is default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        customerId,
      },
    });

    res.status(201).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/addresses - Get customer's addresses
router.get('/', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.customer!.id;

    const addresses = await prisma.address.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/addresses/:id - Get single address
router.get('/:id', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = req.customer!.id;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.customerId !== customerId) {
      res.status(404).json({
        success: false,
        error: 'Address not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/addresses/:id - Update address
router.patch('/:id', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateAddressSchema.parse(req.body);
    const customerId = req.customer!.id;

    // Check ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.customerId !== customerId) {
      res.status(404).json({
        success: false,
        error: 'Address not found',
      });
      return;
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { customerId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = req.customer!.id;

    // Check ownership
    const address = await prisma.address.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!address || address.customerId !== customerId) {
      res.status(404).json({
        success: false,
        error: 'Address not found',
      });
      return;
    }

    // Prevent deletion if address is used in orders
    if (address.orders.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete address used in orders',
      });
      return;
    }

    await prisma.address.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Address deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
