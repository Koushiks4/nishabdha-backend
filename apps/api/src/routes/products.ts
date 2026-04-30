import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '@nishabdha/database';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// GET /api/products - Get all products with optional filters
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category,
      limit = '50',
      offset = '0',
    } = req.query;

    const where: any = {
      status: 'ACTIVE',
    };

    if (category) {
      where.category = String(category);
    }

    // Note: 'featured' filter removed - Product model doesn't have isFeatured field
    // Consider adding this field to schema if needed

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: {
          orderBy: { price: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { price: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create product (admin only)
router.post('/', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      description,
      type,
      basePrice,
      compareAtPrice,
      category,
      tags,
      orientation,
      status = 'DRAFT',
      images = [],
      variants = [],
    } = req.body;

    // Validate required fields
    if (!name || !description || !type || basePrice === undefined) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing required fields: name, description, type, basePrice',
      });
      return;
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Product with this name already exists',
      });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        type,
        status,
        basePrice,
        compareAtPrice: compareAtPrice || null,
        category: category || null,
        tags: tags || [],
        orientation: orientation || null,
        trackInventory: true,
        metaTitle: name,
        metaDescription: description,
        metaKeywords: tags || [],
        images: {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            altText: img.altText || name,
            sortOrder: img.sortOrder ?? index,
          })),
        },
        variants: {
          create: variants.map((v: any) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            stockQuantity: v.stockQuantity || 0,
            lowStockThreshold: v.lowStockThreshold || 5,
            size: v.size || null,
            material: v.material || null,
            frame: v.frame || null,
            color: v.color || null,
          })),
        },
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id - Update product (admin only)
router.patch('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      basePrice,
      compareAtPrice,
      category,
      tags,
      orientation,
      status,
      images,
      variants,
    } = req.body;

    // Check product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, images: true }
    });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    // Update slug if name changes
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slugExists = await prisma.product.findFirst({
        where: { slug, NOT: { id } }
      });
      if (slugExists) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Product with this name already exists',
        });
        return;
      }
    }

    const updateData: any = {
      ...(name && { name, slug }),
      ...(description && { description }),
      ...(type && { type }),
      ...(basePrice !== undefined && { basePrice }),
      ...(compareAtPrice !== undefined && { compareAtPrice }),
      ...(category !== undefined && { category }),
      ...(tags && { tags }),
      ...(orientation !== undefined && { orientation }),
      ...(status && { status }),
    };

    // Handle images update
    if (images) {
      updateData.images = {
        deleteMany: {},
        create: images.map((img: any, index: number) => ({
          url: img.url,
          altText: img.altText || name || existing.name,
          sortOrder: img.sortOrder ?? index,
        })),
      };
    }

    // Handle variants update
    if (variants) {
      updateData.variants = {
        deleteMany: {},
        create: variants.map((v: any) => ({
          name: v.name,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity || 0,
          lowStockThreshold: v.lowStockThreshold || 5,
          size: v.size || null,
          material: v.material || null,
          frame: v.frame || null,
          color: v.color || null,
        })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
      },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
