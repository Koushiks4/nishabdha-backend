import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    log: ("query" | "warn" | "error")[];
    datasources: {
        db: {
            url: string;
        };
    };
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare global {
    var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}
export declare const prisma: PrismaClient<{
    log: ("query" | "warn" | "error")[];
    datasources: {
        db: {
            url: string;
        };
    };
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export {};
//# sourceMappingURL=client.d.ts.map