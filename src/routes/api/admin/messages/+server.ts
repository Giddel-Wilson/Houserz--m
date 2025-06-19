import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const type = url.searchParams.get('type') || 'all'; // all, broadcast, direct

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};
		
		if (type === 'broadcast') {
			where.messageType = 'BROADCAST';
		} else if (type === 'direct') {
			where.messageType = { not: 'BROADCAST' };
		}

		const [messages, total] = await Promise.all([
			prisma.message.findMany({
				where,
				include: {
					sender: {
						select: {
							id: true,
							fullName: true,
							email: true,
							role: true
						}
					},
					conversation: {
						include: {
							initiator: {
								select: {
									id: true,
									fullName: true,
									email: true,
									role: true
								}
							},
							receiver: {
								select: {
									id: true,
									fullName: true,
									email: true,
									role: true
								}
							}
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit
			}),
			prisma.message.count({ where })
		]);

		return json({
			messages,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});

	} catch (error) {
		console.error('Admin messages API error:', error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { recipientIds, content, subject, messageType } = await request.json();

		if (!content || !recipientIds || recipientIds.length === 0) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Create conversations and messages for each recipient
		const results = [];
		
		for (const recipientId of recipientIds) {
			// Create conversation
			const conversation = await prisma.conversation.create({
				data: {
					initiatorId: locals.user.id,
					receiverId: parseInt(recipientId),
					subject: subject || 'Admin Message',
					adminRestricted: true
				}
			});

			// Create message
			const message = await prisma.message.create({
				data: {
					senderId: locals.user.id,
					conversationId: conversation.id,
					content,
					messageType: messageType || 'ANNOUNCEMENT'
				}
			});

			results.push({ conversationId: conversation.id, messageId: message.id });
		}

		// Log admin activity
		await prisma.adminActivity.create({
			data: {
				adminId: locals.user.id,
				action: 'ADMIN_MESSAGE_BROADCAST',
				targetType: 'MESSAGE',
				targetId: results.map(r => r.messageId).join(','),
				details: JSON.stringify({
					recipientCount: recipientIds.length,
					subject: subject,
					messageType: messageType,
					content: content.substring(0, 100) + '...'
				})
			}
		});

		return json({ 
			success: true, 
			message: `Message sent to ${recipientIds.length} recipients successfully`,
			results 
		});

	} catch (error) {
		console.error('Send admin message error:', error);
		return json({ error: 'Failed to send message' }, { status: 500 });
	}
};
