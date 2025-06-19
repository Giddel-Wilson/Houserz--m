import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
  try {
    console.log('Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    console.log('Using shared Prisma instance...');
    console.log('Prisma client exists:', !!prisma);

    // Test basic connection
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);

    // Test if we can query the Property model
    console.log('Testing Property model...');
    const count = await prisma.property.count();
    console.log('Property count:', count);

    // Test if we can fetch properties
    console.log('Testing property fetch...');
    const properties = await prisma.property.findMany({
      take: 3,
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        images: true
      }
    });
    console.log('Properties fetched:', properties.length);

    // No need to clean up with shared instance
    // await prisma.$disconnect();

    return json({
      success: true,
      tests: {
        prismaImport: 'OK',
        databaseConnection: 'OK',
        propertyModel: 'OK',
        propertyCount: count,
        propertiesFetched: properties.length,
        sampleProperty: properties[0] || null
      }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return json({
      success: false,
      error: error.message,
      stack: error.stack,
      debug: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0
      }
    }, { status: 500 });
  }
};
