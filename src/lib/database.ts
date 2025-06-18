import { PrismaClient } from '@prisma/client';

// Create a singleton instance
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Ensure prisma is properly initialized
if (!prisma) {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });
}

export { prisma };

// Legacy compatibility for existing code
export const db = {
  query: async (text: string, params?: any[]) => {
    // This is for backward compatibility
    // You should migrate to use prisma directly instead
    console.warn('Using legacy db.query - consider migrating to Prisma');
    return { rows: [] };
  }
};
