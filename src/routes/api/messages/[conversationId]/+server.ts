import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth.js';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, params }) => {
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

    const { conversationId } = params;
    const userId = decoded.id;

    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get conversation and verify access
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(conversationId),
        OR: [
          { initiatorId: userId },
          { receiverId: userId }
        ]
      },
      select: {
        id: true,
        canReceiverReply: true,
        adminRestricted: true
      }
    });

    if (!conversation) {
      return json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      isRead: msg.isRead,
      isDelivered: msg.isDelivered,
      isSystemMessage: msg.isSystemMessage,
      createdAt: msg.createdAt.toISOString(),
      sender: {
        id: msg.sender.id,
        fullName: msg.sender.fullName,
        email: msg.sender.email,
        role: msg.sender.role
      }
    }));

    return json({ 
      messages: formattedMessages,
      conversation: {
        id: conversation.id,
        canReceiverReply: conversation.canReceiverReply,
        adminRestricted: conversation.adminRestricted
      }
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, params }) => {
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

    const { conversationId } = params;
    const { content, messageType = 'MESSAGE' } = await request.json();
    const userId = decoded.id;

    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify conversation access
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(conversationId),
        OR: [
          { initiatorId: userId },
          { receiverId: userId }
        ]
      }
    });

    if (!conversation) {
      return json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(conversationId),
        senderId: userId,
        content: content.trim(),
        messageType,
        isDelivered: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: parseInt(conversationId) },
      data: { lastMessageAt: new Date() }
    });

    return json({ 
      success: true,
      message: {
        id: message.id,
        conversationId: message.conversationId.toString(),
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType,
        isSystemMessage: message.isSystemMessage,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender
      }
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
