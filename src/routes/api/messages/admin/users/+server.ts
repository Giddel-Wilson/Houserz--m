import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET

interface JWTPayload {
  userId: number;
  role: string;
}

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (err) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin role
    if (decoded.role !== 'ADMIN') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const roleFilter = url.searchParams.get('role');
    const search = url.searchParams.get('search');

    // Build where clause
    const whereClause: any = {
      role: { in: ['CLIENT', 'AGENT'] }, // Exclude other admins
      id: { not: decoded.userId } // Exclude current admin user
    };

    if (roleFilter && ['CLIENT', 'AGENT'].includes(roleFilter)) {
      whereClause.role = roleFilter;
    }

    if (search) {
      whereClause.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: [
        { role: 'asc' }, // Agents first, then clients
        { fullName: 'asc' }
      ]
    });

    return json({
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
};
