import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function GET({ request }) {
	try {
		console.log('[Admin Manage Users API] GET request received');
		
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.slice(7);
		let decoded;
		try {
			decoded = jwt.verify(token, JWT_SECRET);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}
		
		if (!decoded || decoded.role !== 'ADMIN') {
			return json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
		}

		console.log('[Admin Manage Users API] Fetching users from Neon database...');
		
		const users = await prisma.user.findMany({
			select: {
				id: true,
				fullName: true,
				email: true,
				phone: true,
				role: true,
				profileImage: true,
				isVerified: true,
				isActive: true,
				isOnline: true,
				lastSeen: true,
				isSuspended: true,
				isBanned: true,
				suspendedUntil: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						properties: true,
						sentMessages: true,
						penalties: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});
		
		console.log(`[Admin Manage Users API] Found ${users.length} users in database`);

		return json({
			users,
			pagination: {
				page: 1,
				limit: 50,
				total: users.length,
				pages: Math.ceil(users.length / 50)
			}
		});

	} catch (error) {
		console.error('[Admin Manage Users API] Error:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
