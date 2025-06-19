import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { prisma } from '$lib/database.js';
import { verifyToken } from '$lib/auth.js';

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

    const userId = decoded.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        initiator: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true }
        },
        receiver: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true }
        },
        property: {
          select: { id: true, title: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            messageType: true
          }
        }
      },
      orderBy: { 
        lastMessageAt: 'desc'
      }
    });

    const formattedConversations = conversations.map(conv => {
      const isInitiator = conv.initiatorId === userId;
      const otherParticipant = isInitiator ? conv.receiver : conv.initiator;
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        initiatorId: conv.initiatorId,
        receiverId: conv.receiverId,
        subject: conv.subject,
        propertyId: conv.propertyId,
        adminRestricted: conv.adminRestricted,
        canReceiverReply: conv.canReceiverReply,
        createdAt: conv.createdAt,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        initiator: conv.initiator,
        receiver: conv.receiver,
        property: conv.property,
        messages: lastMessage ? [{
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
          messageType: lastMessage.messageType
        }] : []
      };
    });

    return json({ 
      conversations: formattedConversations,
      totalCount: formattedConversations.length 
    });

  } catch (error) {
    console.error('Error loading conversations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
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

    const { receiverId, propertyId, subject, messageContent } = await request.json();
    const userId = decoded.id;
    const userRole = decoded.role || 'CLIENT';

    // Validate receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true }
    });

    if (!receiver) {
      return json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { initiatorId: userId, receiverId: receiverId },
          { initiatorId: receiverId, receiverId: userId }
        ],
        ...(propertyId && { propertyId })
      }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          initiatorId: userId,
          receiverId: receiverId,
          subject: subject || 'New conversation',
          propertyId: propertyId || null,
          adminRestricted: userRole === 'ADMIN',
          canReceiverReply: userRole !== 'ADMIN'
        }
      });
    }

    // Send initial message if provided
    if (messageContent && messageContent.trim()) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: messageContent.trim()
        }
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });
    }

    return json({ conversation });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
