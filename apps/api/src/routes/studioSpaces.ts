import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@nishabdha/database';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Validation schema for creating/updating studio spaces
const studioSpaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/studio-spaces - Get all studio spaces (admin only)
router.get('/', requireAdminAuth, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const spaces = await prisma.studioSpace.findMany({
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

// POST /api/studio-spaces - Create new studio space (admin only)
router.post('/', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = studioSpaceSchema.parse(req.body);

    const space = await prisma.studioSpace.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || '',
        features: validatedData.features || [],
        imageUrl: validatedData.imageUrl || null,
        isActive: validatedData.isActive ?? true,
      },
    });

    res.status(201).json({
      success: true,
      data: { space },
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

// PATCH /api/studio-spaces/:id - Update studio space (admin only)
router.patch('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = studioSpaceSchema.partial().parse(req.body);

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || '';
    if (validatedData.features !== undefined) updateData.features = validatedData.features || [];
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl || null;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const space = await prisma.studioSpace.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { space },
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

// DELETE /api/studio-spaces/:id - Delete studio space (admin only)
router.delete('/:id', requireAdminAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.studioSpace.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Studio space deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router as import("express").Router;
