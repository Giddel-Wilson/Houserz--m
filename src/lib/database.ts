import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Lazy initialization - only create client when accessed
function getPrismaClient(): PrismaClient {
  // Skip initialization during build time or when DATABASE_URL is not available
  if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'test') {
    throw new Error('Database not available during build time or DATABASE_URL not set');
  }

  if (process.env.NODE_ENV === 'production') {
    // In production, create a new client instance
    return new PrismaClient();
  } else {
    // In development, use global to prevent exhausting database connections
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return global.__prisma;
  }
}

// Export a proxy that lazily initializes the client
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Legacy compatibility for existing code
export const db = {
  query: async (text: string, params?: any[]) => {
    // This is for backward compatibility
    // You should migrate to use prisma directly instead
    console.warn('Using legacy db.query - consider migrating to Prisma');
    return { rows: [] };
  }
};
