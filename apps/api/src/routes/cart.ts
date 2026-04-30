import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@nishabdha/database';
import { requireCustomerAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const syncCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().int().min(1),
  })),
});

const addCartItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0),
});

// POST /api/cart/sync - Merge guest cart with server cart
router.post('/sync', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items } = syncCartSchema.parse(req.body);
    const customerId = req.customer!.id;

    // Find or create cart for customer
    let cart = await prisma.cart.findUnique({
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

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
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
    }

    // Validate and merge items
    for (const item of items) {
      // Validate variant exists and is active
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant || !variant.isActive) {
        continue; // Skip inactive variants
      }

      if (variant.stockQuantity < item.quantity) {
        continue; // Skip if not enough stock
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: item.variantId,
          },
        },
      });

      if (existingItem) {
        // Update quantity (sum)
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: Math.min(
              existingItem.quantity + item.quantity,
              variant.stockQuantity
            ),
          },
        });
      } else {
        // Create new cart item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: Math.min(item.quantity, variant.stockQuantity),
          },
        });
      }
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
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

    res.json({
      success: true,
      data: { cart: updatedCart },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cart - Get current user's cart
router.get('/', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.customer!.id;

    let cart = await prisma.cart.findUnique({
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

    if (!cart) {
      // Create empty cart
      cart = await prisma.cart.create({
        data: { customerId },
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
    }

    res.json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items - Add item to cart
router.post('/items', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { variantId, quantity } = addCartItemSchema.parse(req.body);
    const customerId = req.customer!.id;

    // Validate variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.isActive) {
      res.status(404).json({
        success: false,
        error: 'Product variant not found or inactive',
      });
      return;
    }

    if (variant.stockQuantity < quantity) {
      res.status(400).json({
        success: false,
        error: 'Insufficient stock',
        data: {
          available: variant.stockQuantity,
          requested: quantity,
        },
      });
      return;
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
      });
    }

    // Check if item already exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = Math.min(
        existingItem.quantity + quantity,
        variant.stockQuantity
      );

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId,
          quantity: Math.min(quantity, variant.stockQuantity),
        },
      });
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
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

    res.json({
      success: true,
      data: { cart: updatedCart },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/cart/items/:variantId - Update item quantity
router.patch('/items/:variantId', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { quantity } = updateQuantitySchema.parse(req.body);
    const customerId = req.customer!.id;

    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
      return;
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
      include: { variant: true },
    });

    if (!cartItem) {
      res.status(404).json({
        success: false,
        error: 'Item not found in cart',
      });
      return;
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });
    } else {
      // Validate stock
      if (cartItem.variant.stockQuantity < quantity) {
        res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          data: {
            available: cartItem.variant.stockQuantity,
            requested: quantity,
          },
        });
        return;
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      });
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
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

    res.json({
      success: true,
      data: { cart: updatedCart },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/items/:variantId - Remove item from cart
router.delete('/items/:variantId', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { variantId } = req.params;
    const customerId = req.customer!.id;

    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
      return;
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        variantId,
      },
    });

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
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

    res.json({
      success: true,
      data: { cart: updatedCart },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.customer!.id;

    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
});

export default router as import("express").Router;
