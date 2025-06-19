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
    
    if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
      return json({ error: 'Agent access required' }, { status: 403 });
    }

    const userId = decoded.id;

    // Simple query - just get conversations for this user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        initiator: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        property: {
          select: { id: true, title: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Simple formatting
    const formattedConversations = conversations.map(conv => {
      const isInitiator = conv.initiatorId === userId;
      const otherParticipant = isInitiator ? conv.receiver : conv.initiator;
      
      return {
        id: conv.id.toString(),
        type: conv.propertyId ? 'PROPERTY_INQUIRY' : 'GENERAL_CHAT',
        subject: conv.subject || 'No subject',
        otherParticipant: {
          id: otherParticipant.id,
          fullName: otherParticipant.fullName || otherParticipant.email,
          role: otherParticipant.role
        },
        property: conv.property ? {
          id: conv.property.id,
          title: conv.property.title
        } : null,
        lastMessage: null, // Simplified for now
        unreadCount: 0, // Simplified for now
        canReply: true,
        adminRestricted: conv.adminRestricted || false,
        createdAt: conv.createdAt.toISOString(),
        lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : conv.createdAt.toISOString()
      };
    });

    return json({ 
      conversations: formattedConversations,
      totalCount: formattedConversations.length 
    });

  } catch (error) {
    console.error('Agent messages error:', error);
    return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
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
    
    if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
      return json({ error: 'Agent access required' }, { status: 403 });
    }

    const { receiverId, propertyId, messageContent, subject } = await request.json();

    if (!receiverId || !messageContent) {
      return json({ error: 'Receiver ID and message content are required' }, { status: 400 });
    }

    // Check if conversation exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { initiatorId: decoded.id, receiverId },
          { initiatorId: receiverId, receiverId: decoded.id }
        ],
        ...(propertyId && { propertyId })
      }
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          initiatorId: decoded.id,
          receiverId,
          propertyId: propertyId || null,
          subject: subject || 'Agent Message'
        }
      });
    }

    // Send the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: decoded.id,
        content: messageContent
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
    });

    return json({ 
      success: true,
      message: 'Message sent successfully',
      conversationId: conversation.id,
      messageId: message.id
    });

  } catch (error) {
    console.error('Error sending agent message:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
