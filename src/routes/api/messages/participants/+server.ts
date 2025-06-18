import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '$lib/auth.js';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all users except the current user and admins
    const participants = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: decoded.id } },
          { role: { not: 'ADMIN' } },
          { isActive: true }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
        company: true,
        licenseNumber: true,
        isOnline: true
      },
      orderBy: [
        { isOnline: 'desc' },
        { fullName: 'asc' }
      ]
    });

    return json({ 
      participants: participants.map(p => ({
        ...p,
        isOnline: p.isOnline || false
      }))
    });

  } catch (error) {
    console.error('Error loading participants:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
