import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '@nishabdha/database';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// GET /api/customers - Get all customers (admin only)
router.get('/', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '50', offset = '0', search } = req.query;

    const where = search
      ? {
          OR: [
            { email: { contains: search as string, mode: 'insensitive' as const } },
            { phone: { contains: search as string } },
            { name: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        customers: customers.map((customer) => ({
          id: customer.id,
          email: customer.email,
          phone: customer.phone,
          name: customer.name,
          createdAt: customer.createdAt,
          orderCount: customer._count.orders,
        })),
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Get single customer with order history (admin only)
router.get('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        addresses: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            isDefault: true,
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          phone: customer.phone,
          name: customer.name,
          createdAt: customer.createdAt,
          orders: customer.orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            itemCount: order._count.items,
            createdAt: order.createdAt,
          })),
          addresses: customer.addresses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
