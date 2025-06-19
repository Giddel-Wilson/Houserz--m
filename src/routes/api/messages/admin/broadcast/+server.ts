import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET
import { io } from '$lib/server/socket';

interface JWTPayload {
  userId: number;
  role: string;
}

export const POST: RequestHandler = async ({ request }) => {
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

    const { recipientIds, content, subject, messageType } = await request.json();

    if (!content || !content.trim()) {
      return json({ error: 'Message content is required' }, { status: 400 });
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return json({ error: 'At least one recipient is required' }, { status: 400 });
    }

    const validMessageTypes = ['NOTIFICATION', 'ANNOUNCEMENT', 'WARNING'];
    if (messageType && !validMessageTypes.includes(messageType)) {
      return json({ error: 'Invalid message type' }, { status: 400 });
    }

    // Verify recipients exist and get their details
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        role: { in: ['CLIENT', 'AGENT'] }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    });

    if (recipients.length === 0) {
      return json({ error: 'No valid recipients found' }, { status: 400 });
    }

    // Create admin broadcast record
    const adminBroadcast = await prisma.adminBroadcast.create({
      data: {
        senderId: decoded.userId,
        content: content.trim(),
        subject: subject?.trim() || null,
        messageType: messageType || 'NOTIFICATION',
        recipientIds: recipients.map(r => r.id)
      }
    });

    // Create individual conversation records for each recipient
    // Admin messages are one-way - recipients can't reply
    const conversationPromises = recipients.map(async (recipient) => {
      // Check if conversation already exists between admin and this user
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            {
              user1Id: decoded.userId,
              user2Id: recipient.id
            },
            {
              user1Id: recipient.id,
              user2Id: decoded.userId
            }
          ]
        }
      });

      // Create conversation if it doesn't exist
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            user1Id: decoded.userId,
            user2Id: recipient.id,
            isAdminConversation: true // Mark as admin conversation (one-way)
          }
        });
      } else {
        // Update existing conversation to mark as admin conversation
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: { 
            isAdminConversation: true,
            updatedAt: new Date()
          }
        });
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: decoded.userId,
          content: content.trim(),
          messageType: messageType || 'NOTIFICATION',
          isSystemMessage: true,
          adminBroadcastId: adminBroadcast.id
        }
      });

      return { conversation, message, recipient };
    });

    const results = await Promise.all(conversationPromises);

    // Emit real-time notifications to recipients via Socket.IO
    // Note: Socket.IO functionality disabled for build compatibility
    if (false) {
      // for (const { conversation, message, recipient } of results) {
      //   // Join recipient to the conversation room if they're online
      //   const recipientSocketId = socketServer.userSockets.get(recipient.id);
      //   if (recipientSocketId) {
      //     const recipientSocket = socketServer.io.sockets.sockets.get(recipientSocketId);
      //     if (recipientSocket) {
      //       recipientSocket.join(`conversation:${conversation.id}`);
      //       
      //       // Emit the admin message
      //       recipientSocket.emit('admin_message', {
      //         id: message.id,
      //         conversationId: conversation.id,
      //         senderId: decoded.userId,
      //         senderName: 'System Administrator',
      //         content: message.content,
      //         messageType: message.messageType,
      //         subject: subject,
      //         isSystemMessage: true,
      //         createdAt: message.createdAt,
      //         adminBroadcast: true
      //       });

      //       // Emit conversation update
      //       recipientSocket.emit('conversation_update', {
      //         id: conversation.id,
      //         lastMessage: {
      //           content: message.content,
      //           createdAt: message.createdAt,
      //           senderName: 'System Administrator'
      //         },
      //         isAdminConversation: true
      //       });
      //     }
      //   }
      // }
    }

    return json({
      success: true,
      message: `Broadcast message sent to ${recipients.length} recipients`,
      broadcastId: adminBroadcast.id,
      recipientCount: recipients.length
    });

  } catch (error) {
    console.error('Error sending admin broadcast:', error);
    return json({ error: 'Failed to send broadcast message' }, { status: 500 });
  }
};

// Get admin broadcast history
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

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const broadcasts = await prisma.adminBroadcast.findMany({
      where: {
        senderId: decoded.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
      include: {
        sender: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.adminBroadcast.count({
      where: {
        senderId: decoded.userId
      }
    });

    const broadcastsWithRecipientCount = broadcasts.map(broadcast => ({
      ...broadcast,
      recipientCount: broadcast.recipientIds.length
    }));

    return json({
      broadcasts: broadcastsWithRecipientCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin broadcasts:', error);
    return json({ error: 'Failed to fetch broadcast history' }, { status: 500 });
  }
};
