import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { prisma } from '$lib/database.js';
import { verifyToken } from '$lib/auth.js';

export const GET: RequestHandler = async ({ url, request }) => {
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

    const userId = decoded.id;
    const propertyId = url.searchParams.get('property_id');
    const agentId = url.searchParams.get('agent_id');

    if (!agentId) {
      return json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const agentIdNum = parseInt(agentId);
    if (isNaN(agentIdNum)) {
      return json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Look for existing conversation between user and agent for this property
    let whereClause: any = {
      OR: [
        { initiatorId: userId, receiverId: agentIdNum },
        { initiatorId: agentIdNum, receiverId: userId }
      ]
    };

    // If property_id is specified, filter by property as well
    if (propertyId) {
      const propertyIdNum = parseInt(propertyId);
      if (!isNaN(propertyIdNum)) {
        whereClause.propertyId = propertyIdNum;
      }
    }

    const conversation = await prisma.conversation.findFirst({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, fullName: true }
            }
          }
        },
        property: {
          select: { id: true, title: true }
        }
      }
    });

    if (!conversation) {
      return json({ conversation: null });
    }

    const lastMessage = conversation.messages[0];

    return json({
      conversation: {
        id: conversation.id,
        subject: conversation.subject,
        propertyId: conversation.propertyId,
        propertyTitle: conversation.property?.title,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender
        } : null,
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt
      }
    });

  } catch (error: any) {
    console.error('Error fetching user conversations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
