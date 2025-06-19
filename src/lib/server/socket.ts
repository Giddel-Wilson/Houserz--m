import { Server, type Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

interface SocketUser {
  id: number;
  email: string;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export let io: Server | null = null;

export function initializeSocketIO(server: HTTPServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.email} connected with role ${socket.user?.role}`);

    // Update user online status
    if (socket.user) {
      prisma.user.update({
        where: { id: socket.user.id },
        data: { 
          isOnline: true,
          lastSeen: new Date()
        }
      }).then(() => {
        // Broadcast online status to all connected users
        socket.broadcast.emit('user_online_status', {
          userId: socket.user!.id,
          isOnline: true
        });
      }).catch(console.error);

      // Join user to their personal room for notifications
      socket.join(`user_${socket.user.id}`);
      
      // If user is an agent, join agent room for agent-specific broadcasts
      if (socket.user.role === 'AGENT') {
        socket.join('agents');
      }
      
      // If user is admin, join admin room
      if (socket.user.role === 'ADMIN') {
        socket.join('admins');
      }
    }

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        if (!socket.user) return;

        // Verify user has access to this conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: parseInt(conversationId),
            OR: [
              { initiatorId: socket.user.id },
              { receiverId: socket.user.id },
              // Admins can access all conversations
              socket.user.role === 'ADMIN' ? {} : { id: -1 }
            ]
          }
        });

        if (conversation) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.user.email} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', { message: 'Access denied to conversation' });
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user?.email} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      isSystemMessage?: boolean;
    }) => {
      try {
        if (!socket.user) return;

        const { conversationId, content, isSystemMessage = false } = data;

        // Verify conversation access and role permissions
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: parseInt(conversationId),
            OR: [
              { initiatorId: socket.user.id },
              { receiverId: socket.user.id },
              socket.user.role === 'ADMIN' ? {} : { id: -1 }
            ]
          },
          include: {
            initiator: true,
            receiver: true
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }

        // Role-based sending restrictions
        if (socket.user.role === 'CLIENT') {
          // Clients can only send if replies are allowed
          if (!conversation.canReceiverReply) {
            socket.emit('error', { message: 'Cannot reply to admin messages' });
            return;
          }
        }

        // Create the message
        const message = await prisma.message.create({
          data: {
            conversationId: parseInt(conversationId),
            senderId: socket.user.id,
            content,
            isSystemMessage,
            metadata: isSystemMessage ? JSON.stringify({ type: 'system', sender: socket.user.role }) : undefined
          },
          include: {
            sender: {
              select: { id: true, email: true, fullName: true, role: true }
            }
          }
        });

        // Broadcast message to all participants in the conversation
        io?.to(`conversation_${conversationId}`).emit('new_message', {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          isSystemMessage: message.isSystemMessage,
          createdAt: message.createdAt,
          sender: message.sender
        });

        // Send push notification to offline users (if needed)
        const recipients = [
          conversation.initiator?.id,
          conversation.receiver?.id
        ].filter(id => id && id !== socket.user?.id);

        // Update unread counts for recipients
        for (const recipientId of recipients) {
          if (recipientId) {
            // Emit unread count update to user's personal room
            io?.to(`user_${recipientId}`).emit('unread_count_update', {
              conversationId,
              hasUnread: true
            });
          }
        }

        console.log(`Message sent in conversation ${conversationId} by ${socket.user.email}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle marking messages as read
    socket.on('mark_conversation_read', async (conversationId: string) => {
      try {
        if (!socket.user) return;

        // Update messages as read for this user in this conversation
        await prisma.message.updateMany({
          where: {
            conversationId: parseInt(conversationId),
            senderId: { not: socket.user.id },
            isRead: false
          },
          data: {
            isRead: true
          }
        });

        socket.emit('conversation_marked_read', { conversationId });
        console.log(`User ${socket.user.email} marked conversation ${conversationId} as read`);
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId: string) => {
      if (socket.user) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.user.id,
          email: socket.user.email,
          conversationId
        });
      }
    });

    socket.on('typing_stop', (conversationId: string) => {
      if (socket.user) {
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
          userId: socket.user.id,
          conversationId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.email} disconnected`);
      
      // Update user offline status
      if (socket.user) {
        prisma.user.update({
          where: { id: socket.user.id },
          data: { 
            isOnline: false,
            lastSeen: new Date()
          }
        }).then(() => {
          // Broadcast offline status to all connected users
          socket.broadcast.emit('user_online_status', {
            userId: socket.user!.id,
            isOnline: false
          });
        }).catch(console.error);
      }
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

// Helper function to send admin notifications
export async function sendAdminNotification(
  targetUserId: number,
  message: string,
  metadata?: Record<string, any>
) {
  if (!io) return;

  try {
    // Create a system message conversation if needed
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { OR: [{ initiatorId: targetUserId }, { receiverId: targetUserId }] },
          { adminRestricted: true },
          { canReceiverReply: false }
        ]
      }
    });

    if (!conversation) {
      // Create admin notification conversation
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) return;

      // Find or create admin user
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!adminUser) return;

      conversation = await prisma.conversation.create({
        data: {
          initiatorId: adminUser.id,
          receiverId: targetUserId,
          subject: 'System Notifications',
          adminRestricted: true,
          canReceiverReply: false
        }
      });
    }

    // Find or create admin user for system messages
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) return;

    // Create the notification message
    const notificationMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: adminUser.id,
        content: message,
        isSystemMessage: true,
        metadata: metadata ? JSON.stringify({ type: 'admin_notification', ...metadata }) : undefined
      },
      include: {
        sender: {
          select: { id: true, email: true, fullName: true, role: true }
        }
      }
    });

    // Send real-time notification
    io.to(`user_${targetUserId}`).emit('admin_notification', {
      id: notificationMessage.id,
      conversationId: conversation.id,
      content: message,
      createdAt: notificationMessage.createdAt,
      metadata
    });

    // Update unread count
    io.to(`user_${targetUserId}`).emit('unread_count_update', {
      conversationId: conversation.id,
      hasUnread: true
    });

    console.log(`Admin notification sent to user ${targetUserId}`);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

// Helper function to broadcast to all agents
export function broadcastToAgents(event: string, data: any) {
  if (!io) return;
  io.to('agents').emit(event, data);
}

// Helper function to broadcast to all admins
export function broadcastToAdmins(event: string, data: any) {
  if (!io) return;
  io.to('admins').emit(event, data);
}
