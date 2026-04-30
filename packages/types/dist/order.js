"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderFilterSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = exports.createAddressSchema = exports.cartItemSchema = void 0;
const zod_1 = require("zod");
exports.cartItemSchema = zod_1.z.object({
    variantId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
});
exports.createAddressSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).max(255),
    phone: zod_1.z.string().min(1).max(20),
    addressLine1: zod_1.z.string().min(1).max(255),
    addressLine2: zod_1.z.string().max(255).optional(),
    city: zod_1.z.string().min(1).max(100),
    state: zod_1.z.string().min(1).max(100),
    pincode: zod_1.z.string().min(1).max(20),
    country: zod_1.z.string().min(1).max(100).default('India'),
    isDefault: zod_1.z.boolean().default(false),
});
exports.createOrderSchema = zod_1.z.object({
    items: zod_1.z.array(exports.cartItemSchema).min(1),
    addressId: zod_1.z.string().uuid(),
    customerNotes: zod_1.z.string().optional(),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING_PAYMENT', 'PAYMENT_FAILED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    trackingNumber: zod_1.z.string().optional(),
    trackingUrl: zod_1.z.string().url().optional(),
    adminNotes: zod_1.z.string().optional(),
});
exports.orderFilterSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING_PAYMENT', 'PAYMENT_FAILED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    customerId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=order.js.map