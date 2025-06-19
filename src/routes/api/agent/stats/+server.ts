import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth';
import { prisma } from '$lib/database.js';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.slice(7);
		const decoded = verifyToken(token);
		
		if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get accurate agent stats from database using Prisma
		
		// 1. Total Properties - Count all properties for this agent
		const totalProperties = await prisma.property.count({
			where: { agentId: decoded.id }
		});

		// 2. Active Listings - Count only ACTIVE status properties
		const activeListings = await prisma.property.count({
			where: { 
				agentId: decoded.id,
				status: 'ACTIVE'
			}
		});

		// 3. Total Views - Sum all views from properties
		const viewsAggregate = await prisma.property.aggregate({
			where: { agentId: decoded.id },
			_sum: { viewsCount: true }
		});
		const totalViews = viewsAggregate._sum.viewsCount || 0;

		// 4. Unread Messages - Count unread messages in conversations involving agent's properties
		const messagesUnread = await prisma.message.count({
			where: {
				conversation: {
					property: {
						agentId: decoded.id
					}
				},
				isRead: false,
				senderId: { not: decoded.id }
			}
		});

		return json({
			totalProperties,
			activeListings,
			totalViews,
			messagesUnread
		});

	} catch (error) {
		console.error('Error fetching agent stats:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({ 
			error: 'Internal server error',
			details: errorMessage 
		}, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
};
