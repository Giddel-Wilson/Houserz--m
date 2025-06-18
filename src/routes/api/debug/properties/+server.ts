import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
  try {
    const properties = await prisma.property.findMany({
      take: 5,
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            isPrimary: true
          }
        }
      }
    });

    return json({
      debug: true,
      count: properties.length,
      properties: properties,
      sample_property: properties[0] || null
    });
  } catch (error) {
    return json({
      debug: true,
      error: error.message,
      stack: error.stack
    });
  }
};
