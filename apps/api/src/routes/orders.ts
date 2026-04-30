import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@nishabdha/database';
import { requireCustomerAuth, requireAdminAuth } from '../middleware/auth';
import { createPaymentOrder, verifyWebhookSignature } from '../services/cashfree';
import { config } from '../config';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  addressId: z.string(),
});

// ============================================
// ADMIN ROUTES
// ============================================

// GET /api/orders/admin - Get all orders (admin only)
router.get('/admin', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '50', offset = '0', status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
            },
          },
          address: true,
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(String(limit)),
        skip: parseInt(String(offset)),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customer: order.customer,
          address: order.address,
          items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName,
            variantName: item.variantName,
            product: item.variant.product,
          })),
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          tax: order.tax,
          total: order.total,
          paymentMethod: order.paymentMethod,
          cashfreeOrderId: order.cashfreeOrderId,
          cashfreePaymentId: order.cashfreePaymentId,
          trackingNumber: order.trackingNumber,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
        })),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/admin/:orderNumber - Get single order (admin only)
router.get('/admin/:orderNumber', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
          },
        },
        address: true,
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customer: order.customer,
          address: order.address,
          items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName,
            variantName: item.variantName,
            variant: item.variant,
          })),
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          tax: order.tax,
          total: order.total,
          paymentMethod: order.paymentMethod,
          cashfreeOrderId: order.cashfreeOrderId,
          cashfreePaymentId: order.cashfreePaymentId,
          trackingNumber: order.trackingNumber,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/admin/:id/status - Update order status (admin only)
router.patch('/admin/:id/status', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    const updateData: any = { status };
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CUSTOMER ROUTES
// ============================================

// POST /api/orders/validate-cart - Pre-checkout validation
router.post('/validate-cart', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.customer!.id;

    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.json({
        success: true,
        data: {
          valid: false,
          issues: [{ issue: 'CART_EMPTY', message: 'Cart is empty' }],
        },
      });
      return;
    }

    const issues: any[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      // Check if variant is still active
      if (!item.variant.isActive) {
        issues.push({
          variantId: item.variantId,
          productName: item.product.name,
          variantName: item.variant.name,
          issue: 'VARIANT_INACTIVE',
          message: 'Product no longer available',
        });
        continue;
      }

      // Check stock
      if (item.variant.stockQuantity < item.quantity) {
        issues.push({
          variantId: item.variantId,
          productName: item.product.name,
          variantName: item.variant.name,
          issue: 'OUT_OF_STOCK',
          message: `Only ${item.variant.stockQuantity} available`,
          available: item.variant.stockQuantity,
          requested: item.quantity,
        });
        continue;
      }

      // Calculate price
      const price = item.variant.price || item.product.basePrice;
      subtotal += Number(price) * item.quantity;
    }

    const shippingCost = 0;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    res.json({
      success: true,
      data: {
        valid: issues.length === 0,
        issues,
        pricing: {
          subtotal,
          shipping: shippingCost,
          tax,
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Create order and initiate payment
router.post('/', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { addressId } = createOrderSchema.parse(req.body);
    const customerId = req.customer!.id;

    // Validate address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.customerId !== customerId) {
      res.status(403).json({
        success: false,
        error: 'Invalid address',
      });
      return;
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cart is empty',
      });
      return;
    }

    // Validate cart items and calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of cart.items) {
      if (!item.variant.isActive || item.variant.stockQuantity < item.quantity) {
        res.status(400).json({
          success: false,
          error: 'Cart validation failed. Please review your cart.',
        });
        return;
      }

      const price = item.variant.price || item.product.basePrice;
      subtotal += Number(price) * item.quantity;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant.name,
        price: Number(price),
        quantity: item.quantity,
      });
    }

    const shippingCost = 0;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    // Generate order number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const dailyCount = await prisma.order.count({
      where: {
        orderNumber: { startsWith: `ORD-${today}` },
      },
    });
    const orderNumber = `ORD-${today}-${String(dailyCount + 1).padStart(4, '0')}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        addressId,
        status: 'PENDING',
        subtotal,
        shippingCost,
        tax,
        total,
        paymentMethod: 'cashfree',
        items: {
          create: orderItems,
        },
      },
    });

    // Create Cashfree payment order
    const cashfreeOrder = await createPaymentOrder({
      orderId: `CF_${order.id}`,
      orderAmount: Number(total),
      customerEmail: req.customer!.email!,
      customerPhone: address.phone,
      customerName: address.fullName,
      returnUrl: `${config.frontendUrl}/orders/${orderNumber}/confirmed`,
    });

    // Update order with Cashfree details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        cashfreeOrderId: `CF_${order.id}`,
        status: 'PAYMENT_INITIATED',
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: Number(total),
        cashfree: cashfreeOrder,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/cashfree-webhook - Handle Cashfree payment webhooks
router.post('/cashfree-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    if (!signature || !timestamp || !verifyWebhookSignature(rawBody, signature, timestamp)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const { data } = req.body;
    const { order_id, payment_status, payment_id } = data.order || data.payment || {};

    if (!order_id) {
      res.status(400).json({ error: 'Missing order_id' });
      return;
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { cashfreeOrderId: order_id },
      include: {
        customer: {
          include: {
            cart: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Update order based on payment status
    if (payment_status === 'SUCCESS' || payment_status === 'PAID') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          cashfreePaymentId: payment_id,
        },
      });

      // Clear customer cart
      if (order.customer.cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: order.customer.cart.id },
        });
      }

      // TODO: Send order confirmation email
    } else if (payment_status === 'FAILED' || payment_status === 'USER_DROPPED') {
      // Keep status as PAYMENT_INITIATED (user can retry)
      // Optionally update to PENDING if needed
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/orders - Get customer's order history
router.get('/', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.customer!.id;
    const { limit = '20', offset = '0', status } = req.query;

    const where: any = { customerId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
    });

    const total = await prisma.order.count({ where });

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: Number(order.total),
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: order.createdAt,
        })),
        total,
        hasMore: parseInt(String(offset)) + orders.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:orderNumber - Get single order details
router.get('/:orderNumber', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const customerId = req.customer!.id;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        address: true,
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order || order.customerId !== customerId) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:orderNumber/verify-payment - Verify payment status after completion
router.post('/:orderNumber/verify-payment', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const customerId = req.customer!.id;

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order || order.customerId !== customerId) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    // If already paid, return success
    if (order.status === 'PAID' || order.status === 'PROCESSING') {
      res.json({
        success: true,
        data: {
          order,
          alreadyPaid: true
        },
      });
      return;
    }

    // Fetch payment status from Cashfree
    if (!order.cashfreeOrderId) {
      res.status(400).json({
        success: false,
        error: 'No Cashfree order ID found',
      });
      return;
    }

    const { getPaymentStatus } = await import('../services/cashfree');
    const paymentData = await getPaymentStatus(order.cashfreeOrderId);

    // Payment data is an array of payment objects
    const payments = Array.isArray(paymentData) ? paymentData : [];
    const successfulPayment = payments.find((p: any) =>
      p.payment_status === 'SUCCESS' || p.payment_status === 'PAID'
    );

    if (successfulPayment) {
      // Update order status to PAID
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentMethod: successfulPayment.payment_group || 'online',
          paidAt: new Date(successfulPayment.payment_completion_time || new Date()),
          cashfreePaymentId: String(successfulPayment.cf_payment_id),
        },
      });

      res.json({
        success: true,
        data: {
          order: updatedOrder,
          paymentVerified: true
        },
      });
      return;
    }

    // Payment not successful yet
    res.json({
      success: true,
      data: {
        order,
        paymentVerified: false,
        status: payments[0]?.payment_status || 'PENDING'
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
