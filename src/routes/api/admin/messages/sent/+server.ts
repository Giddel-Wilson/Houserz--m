import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth.js';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get admin broadcast messages
    const broadcasts = await prisma.adminBroadcast.findMany({
      where: {
        senderId: decoded.id
      },
      include: {
        messages: {
          select: {
            id: true,
            isRead: true,
            isDelivered: true,
            createdAt: true,
            conversation: {
              select: {
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
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Transform the data to show delivery and read status
    const messages = broadcasts.map(broadcast => {
      const recipientIds = JSON.parse(broadcast.recipientIds);
      const totalRecipients = recipientIds.length;
      const deliveredCount = broadcast.messages.filter(m => m.isDelivered).length;
      const readCount = broadcast.messages.filter(m => m.isRead).length;

      return {
        id: broadcast.id,
        subject: broadcast.subject,
        content: broadcast.content,
        messageType: broadcast.messageType,
        createdAt: broadcast.createdAt,
        totalRecipients,
        deliveredCount,
        readCount,
        deliveryRate: totalRecipients > 0 ? (deliveredCount / totalRecipients * 100).toFixed(1) : '0',
        readRate: totalRecipients > 0 ? (readCount / totalRecipients * 100).toFixed(1) : '0',
        recipients: broadcast.messages.map(m => ({
          id: m.conversation.receiver.id,
          fullName: m.conversation.receiver.fullName,
          email: m.conversation.receiver.email,
          role: m.conversation.receiver.role,
          isDelivered: m.isDelivered,
          isRead: m.isRead,
          deliveredAt: m.createdAt
        }))
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.adminBroadcast.count({
      where: {
        senderId: decoded.id
      }
    });

    return json({
      messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching sent admin messages:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
