import { z } from 'zod';
export declare const cartItemSchema: z.ZodObject<{
    variantId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    variantId: string;
    quantity: number;
}, {
    variantId: string;
    quantity: number;
}>;
export type CartItem = z.infer<typeof cartItemSchema>;
export declare const createAddressSchema: z.ZodObject<{
    fullName: z.ZodString;
    phone: z.ZodString;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
    addressLine2?: string | undefined;
}, {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    addressLine2?: string | undefined;
    country?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export declare const createOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        variantId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        variantId: string;
        quantity: number;
    }, {
        variantId: string;
        quantity: number;
    }>, "many">;
    addressId: z.ZodString;
    customerNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        variantId: string;
        quantity: number;
    }[];
    addressId: string;
    customerNotes?: string | undefined;
}, {
    items: {
        variantId: string;
        quantity: number;
    }[];
    addressId: string;
    customerNotes?: string | undefined;
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING_PAYMENT", "PAYMENT_FAILED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    trackingUrl: z.ZodOptional<z.ZodString>;
    adminNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING_PAYMENT" | "PAYMENT_FAILED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
    trackingNumber?: string | undefined;
    trackingUrl?: string | undefined;
    adminNotes?: string | undefined;
}, {
    status: "PENDING_PAYMENT" | "PAYMENT_FAILED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
    trackingNumber?: string | undefined;
    trackingUrl?: string | undefined;
    adminNotes?: string | undefined;
}>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export declare const orderFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["PENDING_PAYMENT", "PAYMENT_FAILED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]>>;
    customerId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING_PAYMENT" | "PAYMENT_FAILED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" | undefined;
    customerId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}, {
    status?: "PENDING_PAYMENT" | "PAYMENT_FAILED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" | undefined;
    customerId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}>;
export type OrderFilter = z.infer<typeof orderFilterSchema>;
//# sourceMappingURL=order.d.ts.map