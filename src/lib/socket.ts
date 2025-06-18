import { Server } from 'socket.io';
import { verifyToken } from './auth.js';
import type { ViteDevServer } from 'vite';

let io: Server;

export function initializeSocketServer(server: any) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error'));
    }

    socket.data.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.id} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.data.user.id}`);

    // Handle joining conversation rooms
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.data.user.id} joined conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send-message', async (messageData) => {
      try {
        // TODO: Save message to database
        const message = {
          id: Date.now(),
          conversationId: messageData.conversationId,
          senderId: socket.data.user.id,
          content: messageData.content,
          timestamp: new Date().toISOString(),
          type: messageData.type || 'text',
          sender: {
            id: socket.data.user.id,
            fullName: socket.data.user.full_name || socket.data.user.name
          }
        };

        // Broadcast to all users in the conversation
        io.to(`conversation_${messageData.conversationId}`).emit('message', message);
        
        console.log(`Message sent in conversation ${messageData.conversationId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('typing', {
        userId: socket.data.user.id,
        isTyping: data.isTyping
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.id} disconnected`);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
