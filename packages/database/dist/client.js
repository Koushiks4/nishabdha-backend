"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const prismaClientSingleton = () => {
    // In development, disable prepared statements to prevent "prepared statement already exists"
    // errors during hot reload. pgbouncer=true disables prepared statements.
    const databaseUrl = process.env.DATABASE_URL || '';
    const urlWithParams = process.env.NODE_ENV !== 'production' && !databaseUrl.includes('pgbouncer=true')
        ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}pgbouncer=true`
        : databaseUrl;
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: urlWithParams,
            },
        },
    });
};
exports.prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = exports.prisma;
}
//# sourceMappingURL=client.js.map