import { createServer } from 'http';
import { Server } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';

export interface ChatMessage {
	id: string;
	senderId: number;
	senderName: string;
	recipientId: number;
	propertyId?: number;
	message: string;
	timestamp: Date;
	isRead: boolean;
}

export interface ChatRoom {
	id: string;
	participants: number[];
	propertyId?: number;
	lastMessage?: ChatMessage;
}

class ChatServer {
	private io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
	private connectedUsers: Map<number, string> = new Map();
	private userSockets: Map<string, number> = new Map();

	constructor(server: any) {
		this.io = new Server(server, {
			cors: {
				origin: process.env.PUBLIC_APP_URL || "http://localhost:5173",
				methods: ["GET", "POST"]
			}
		});

		this.setupSocketHandlers();
	}

	private setupSocketHandlers() {
		this.io.on('connection', (socket) => {
			console.log('User connected:', socket.id);

			// Handle user joining
			socket.on('join', ({ userId, userRole }) => {
				this.connectedUsers.set(userId, socket.id);
				this.userSockets.set(socket.id, userId);
				
				// Join user-specific room for notifications
				socket.join(`user_${userId}`);
				
				console.log(`User ${userId} (${userRole}) joined`);
			});

			// Handle joining a chat room
			socket.on('join_chat', ({ roomId, userId }) => {
				socket.join(roomId);
				console.log(`User ${userId} joined chat room ${roomId}`);
			});

			// Handle sending messages
			socket.on('send_message', async (data: {
				roomId: string;
				senderId: number;
				senderName: string;
				recipientId: number;
				propertyId?: number;
				message: string;
			}) => {
				try {
					const messageData: ChatMessage = {
						id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						senderId: data.senderId,
						senderName: data.senderName,
						recipientId: data.recipientId,
						propertyId: data.propertyId,
						message: data.message,
						timestamp: new Date(),
						isRead: false
					};

					// Broadcast to room
					this.io.to(data.roomId).emit('new_message', messageData);

					// Send notification to recipient if they're online
					const recipientSocketId = this.connectedUsers.get(data.recipientId);
					if (recipientSocketId) {
						this.io.to(`user_${data.recipientId}`).emit('notification', {
							type: 'message',
							title: 'New Message',
							body: `${data.senderName}: ${data.message}`,
							data: messageData
						});
					}

					// Here you would typically save to database
					console.log('Message sent:', messageData);
				} catch (error) {
					console.error('Error sending message:', error);
					socket.emit('error', { message: 'Failed to send message' });
				}
			});

			// Handle marking messages as read
			socket.on('mark_as_read', ({ roomId, userId }) => {
				socket.to(roomId).emit('messages_read', { userId });
			});

			// Handle typing indicators
			socket.on('typing_start', ({ roomId, userId, userName }) => {
				socket.to(roomId).emit('user_typing', { userId, userName });
			});

			socket.on('typing_stop', ({ roomId, userId }) => {
				socket.to(roomId).emit('user_stopped_typing', { userId });
			});

			// Handle disconnection
			socket.on('disconnect', () => {
				const userId = this.userSockets.get(socket.id);
				if (userId) {
					this.connectedUsers.delete(userId);
					this.userSockets.delete(socket.id);
					console.log(`User ${userId} disconnected`);
				}
			});
		});
	}

	getConnectedUsers() {
		return Array.from(this.connectedUsers.keys());
	}

	sendNotificationToUser(userId: number, notification: any) {
		this.io.to(`user_${userId}`).emit('notification', notification);
	}
}

export { ChatServer };
