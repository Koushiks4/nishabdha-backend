import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().min(1),
  type: z.enum(['ARTWORK', 'MERCHANDISE', 'CREATOR_KIT']),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  basePrice: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  collectionId: z.string().uuid().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  orientation: z.string().optional(),
  trackInventory: z.boolean().default(true),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createVariantSchema = z.object({
  name: z.string().min(1).max(255),
  productId: z.string().uuid(),
  sku: z.string().min(1).max(100),
  price: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().positive().default(5),
  size: z.string().optional(),
  material: z.string().optional(),
  frame: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = createVariantSchema.partial().omit({ productId: true });

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const productFilterSchema = z.object({
  collectionId: z.string().uuid().optional(),
  type: z.enum(['ARTWORK', 'MERCHANDISE', 'CREATOR_KIT']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().optional(),
});

export type ProductFilter = z.infer<typeof productFilterSchema>;
