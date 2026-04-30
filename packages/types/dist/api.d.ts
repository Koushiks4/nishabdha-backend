import { z } from 'zod';
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data?: unknown;
    error?: string | undefined;
    message?: string | undefined;
}, {
    success: boolean;
    data?: unknown;
    error?: string | undefined;
    message?: string | undefined;
}>;
export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};
export declare const paginatedResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodUnknown, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: unknown[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}, {
    data: unknown[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type JWTPayload = {
    userId: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
    iat: number;
    exp: number;
};
export type OTPSession = {
    email: string;
    otp: string;
    expiresAt: Date;
    verified: boolean;
};
//# sourceMappingURL=api.d.ts.map