import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // In development, disable prepared statements to prevent "prepared statement already exists"
  // errors during hot reload. pgbouncer=true disables prepared statements.
  const databaseUrl = process.env.DATABASE_URL || '';
  const urlWithParams = process.env.NODE_ENV !== 'production' && !databaseUrl.includes('pgbouncer=true')
    ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}pgbouncer=true`
    : databaseUrl;

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: urlWithParams,
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
