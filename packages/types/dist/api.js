"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.paginatedResponseSchema = exports.apiResponseSchema = void 0;
const zod_1 = require("zod");
exports.apiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
exports.paginatedResponseSchema = zod_1.z.object({
    data: zod_1.z.array(zod_1.z.unknown()),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
//# sourceMappingURL=api.js.map