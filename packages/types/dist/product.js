"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productFilterSchema = exports.updateVariantSchema = exports.createVariantSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    slug: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1),
    type: zod_1.z.enum(['ARTWORK', 'MERCHANDISE', 'CREATOR_KIT']),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
    basePrice: zod_1.z.number().positive(),
    compareAtPrice: zod_1.z.number().positive().optional(),
    collectionId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    orientation: zod_1.z.string().optional(),
    trackInventory: zod_1.z.boolean().default(true),
    metaTitle: zod_1.z.string().max(255).optional(),
    metaDescription: zod_1.z.string().optional(),
    metaKeywords: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.createVariantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    productId: zod_1.z.string().uuid(),
    sku: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().positive().optional(),
    stockQuantity: zod_1.z.number().int().min(0).default(0),
    lowStockThreshold: zod_1.z.number().int().positive().default(5),
    size: zod_1.z.string().optional(),
    material: zod_1.z.string().optional(),
    frame: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateVariantSchema = exports.createVariantSchema.partial().omit({ productId: true });
exports.productFilterSchema = zod_1.z.object({
    collectionId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(['ARTWORK', 'MERCHANDISE', 'CREATOR_KIT']).optional(),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    minPrice: zod_1.z.coerce.number().positive().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=product.js.map