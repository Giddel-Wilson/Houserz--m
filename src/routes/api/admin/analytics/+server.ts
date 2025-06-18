import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth.js';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const decoded = verifyToken(token);
		
		if (!decoded || decoded.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const period = url.searchParams.get('period') || '30'; // days
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - parseInt(period));

		// Get basic counts
		const [totalUsers, totalAgents, totalClients, totalProperties, totalMessages, totalConversations] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { role: 'AGENT' } }),
			prisma.user.count({ where: { role: 'CLIENT' } }),
			prisma.property.count(),
			prisma.message.count(),
			prisma.conversation.count()
		]);

		// Get user growth over time
		const userGrowth = await prisma.user.groupBy({
			by: ['createdAt'],
			_count: { id: true },
			where: {
				createdAt: { gte: startDate }
			},
			orderBy: { createdAt: 'asc' }
		});

		// Get property statistics
		const propertyStats = await prisma.property.groupBy({
			by: ['propertyType', 'status'],
			_count: { id: true }
		});

		// Get location statistics by city (corrected field name)
		const locationStats = await prisma.property.groupBy({
			by: ['city'],
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } },
			take: 10
		});

		// Get message statistics
		const messageStats = await prisma.message.groupBy({
			by: ['createdAt'],
			_count: { id: true },
			where: {
				createdAt: { gte: startDate }
			},
			orderBy: { createdAt: 'asc' }
		});

		// Calculate growth percentages (comparing last 30 days to previous 30 days)
		const previousPeriodStart = new Date();
		previousPeriodStart.setDate(previousPeriodStart.getDate() - (parseInt(period) * 2));
		previousPeriodStart.setDate(previousPeriodStart.getDate() + parseInt(period));

		const [previousUsers, previousProperties, previousMessages] = await Promise.all([
			prisma.user.count({
				where: {
					createdAt: {
						gte: previousPeriodStart,
						lt: startDate
					}
				}
			}),
			prisma.property.count({
				where: {
					createdAt: {
						gte: previousPeriodStart,
						lt: startDate
					}
				}
			}),
			prisma.message.count({
				where: {
					createdAt: {
						gte: previousPeriodStart,
						lt: startDate
					}
				}
			})
		]);

		const currentUsers = await prisma.user.count({
			where: { createdAt: { gte: startDate } }
		});
		
		const currentProperties = await prisma.property.count({
			where: { createdAt: { gte: startDate } }
		});
		
		const currentMessages = await prisma.message.count({
			where: { createdAt: { gte: startDate } }
		});

		const userGrowthPercentage = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;
		const propertyGrowthPercentage = previousProperties > 0 ? ((currentProperties - previousProperties) / previousProperties) * 100 : 0;
		const messageGrowthPercentage = previousMessages > 0 ? ((currentMessages - previousMessages) / previousMessages) * 100 : 0;

		// Get recent activity
		const recentActivities = await prisma.user.findMany({
			where: {
				createdAt: { gte: startDate }
			},
			select: {
				id: true,
				fullName: true,
				email: true,
				role: true,
				createdAt: true,
				lastSeen: true,
				isOnline: true
			},
			orderBy: { createdAt: 'desc' },
			take: 10
		});

		// Format data for charts
		const userGrowthChart = userGrowth.map(item => ({
			date: item.createdAt.toISOString().split('T')[0],
			count: item._count.id
		}));

		const propertyTypeChart = propertyStats.reduce((acc, item) => {
			const existing = acc.find(p => p.type === item.propertyType);
			if (existing) {
				existing.count += item._count.id;
			} else {
				acc.push({ type: item.propertyType, count: item._count.id });
			}
			return acc;
		}, [] as any[]);

		const propertyStatusChart = propertyStats.reduce((acc, item) => {
			const existing = acc.find(p => p.status === item.status);
			if (existing) {
				existing.count += item._count.id;
			} else {
				acc.push({ status: item.status, count: item._count.id });
			}
			return acc;
		}, [] as any[]);

		const messageChart = messageStats.map(item => ({
			date: item.createdAt.toISOString().split('T')[0],
			count: item._count.id
		}));

		return json({
			totalUsers,
			totalAgents,
			totalProperties,
			totalMessages,
			userGrowth: userGrowthPercentage,
			agentGrowth: userGrowthPercentage, // Using same growth rate for agents as users
			propertyGrowth: propertyGrowthPercentage,
			messageGrowth: messageGrowthPercentage,
			monthlySignups: userGrowthChart,
			propertyTypes: propertyTypeChart.map(item => ({
				type: item.type,
				count: item.count,
				percentage: totalProperties > 0 ? ((item.count / totalProperties) * 100).toFixed(1) : '0'
			})),
			locationStats: locationStats.map(item => ({
				name: item.city,
				count: item._count.id,
				avgPrice: 0, // This would need actual price calculation
				growth: 0 // This would need actual growth calculation
			})),
			revenueData: [], // Add revenue data if needed
			overview: {
				totalUsers,
				totalAgents,
				totalClients,
				totalProperties,
				totalMessages,
				totalConversations,
				userGrowth: userGrowthPercentage,
				propertyGrowth: propertyGrowthPercentage,
				messageGrowth: messageGrowthPercentage
			},
			charts: {
				userGrowth: userGrowthChart,
				propertyTypes: propertyTypeChart,
				propertyStatus: propertyStatusChart,
				messageActivity: messageChart,
				locationStats: locationStats.map(item => ({
					location: item.city,
					count: item._count.id
				}))
			},
			recentActivities
		});

	} catch (error) {
		console.error('Analytics API error:', error);
		return json({ error: 'Failed to fetch analytics data' }, { status: 500 });
	}
};
