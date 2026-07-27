import { PrismaClient } from '@prisma/client';

// Prisma Singleton Instance with DATABASE_URL validation (.env)
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url || url.includes('placeholder')) {
    console.warn('⚠️ WARNING: DATABASE_URL is missing or unconfigured in .env file.');
  }
  return url || 'postgresql://placeholder:placeholder@localhost:5432/neondb';
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
