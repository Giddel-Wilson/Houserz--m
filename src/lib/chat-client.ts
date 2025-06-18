import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from './chat-server';

interface ChatState {
	connected: boolean;
	activeRooms: Set<string>;
	messages: Map<string, ChatMessage[]>;
	typingUsers: Map<string, Set<string>>;
	unreadCounts: Map<string, number>;
}

const initialState: ChatState = {
	connected: false,
	activeRooms: new Set(),
	messages: new Map(),
	typingUsers: new Map(),
	unreadCounts: new Map()
};

export const chatStore = writable<ChatState>(initialState);

class ChatClient {
	private socket: Socket | null = null;
	private userId: number | null = null;
	private userName: string | null = null;

	connect(userId: number, userName: string, userRole: string) {
		if (this.socket?.connected) {
			return;
		}

		this.userId = userId;
		this.userName = userName;

		this.socket = io(window.location.origin, {
			transports: ['websocket', 'polling']
		});

		this.setupEventHandlers();

		this.socket.emit('join', { userId, userRole });
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		
		chatStore.set(initialState);
	}

	private setupEventHandlers() {
		if (!this.socket) return;

		this.socket.on('connect', () => {
			console.log('Connected to chat server');
			chatStore.update(state => ({ ...state, connected: true }));
		});

		this.socket.on('disconnect', () => {
			console.log('Disconnected from chat server');
			chatStore.update(state => ({ ...state, connected: false }));
		});

		this.socket.on('new_message', (message: ChatMessage) => {
			chatStore.update(state => {
				const roomId = this.getRoomId(message.senderId, message.recipientId, message.propertyId);
				const roomMessages = state.messages.get(roomId) || [];
				
				return {
					...state,
					messages: new Map(state.messages).set(roomId, [...roomMessages, message]),
					unreadCounts: new Map(state.unreadCounts).set(
						roomId, 
						(state.unreadCounts.get(roomId) || 0) + (message.senderId !== this.userId ? 1 : 0)
					)
				};
			});
		});

		this.socket.on('user_typing', ({ userId, userName }: { userId: number, userName: string }) => {
			chatStore.update(state => {
				const newTypingUsers = new Map(state.typingUsers);
				// Add to all rooms this user might be in
				state.activeRooms.forEach(roomId => {
					const typingInRoom = newTypingUsers.get(roomId) || new Set();
					typingInRoom.add(userName);
					newTypingUsers.set(roomId, typingInRoom);
				});
				
				return { ...state, typingUsers: newTypingUsers };
			});

			// Auto-clear typing indicator after 3 seconds
			setTimeout(() => {
				chatStore.update(state => {
					const newTypingUsers = new Map(state.typingUsers);
					state.activeRooms.forEach(roomId => {
						const typingInRoom = newTypingUsers.get(roomId);
						if (typingInRoom) {
							typingInRoom.delete(userName);
							newTypingUsers.set(roomId, typingInRoom);
						}
					});
					
					return { ...state, typingUsers: newTypingUsers };
				});
			}, 3000);
		});

		this.socket.on('user_stopped_typing', ({ userId }: { userId: number }) => {
			// Handle when user stops typing
		});

		this.socket.on('notification', (notification) => {
			// Handle notifications (could integrate with a notification system)
			console.log('Notification received:', notification);
		});

		this.socket.on('error', (error) => {
			console.error('Chat error:', error);
		});
	}

	joinRoom(roomId: string) {
		if (!this.socket || !this.userId) return;

		this.socket.emit('join_chat', { roomId, userId: this.userId });
		
		chatStore.update(state => ({
			...state,
			activeRooms: new Set(state.activeRooms).add(roomId)
		}));
	}

	sendMessage(recipientId: number, message: string, propertyId?: number) {
		if (!this.socket || !this.userId || !this.userName) return;

		const roomId = this.getRoomId(this.userId, recipientId, propertyId);
		
		this.socket.emit('send_message', {
			roomId,
			senderId: this.userId,
			senderName: this.userName,
			recipientId,
			propertyId,
			message
		});
	}

	startTyping(recipientId: number, propertyId?: number) {
		if (!this.socket || !this.userId || !this.userName) return;

		const roomId = this.getRoomId(this.userId, recipientId, propertyId);
		
		this.socket.emit('typing_start', {
			roomId,
			userId: this.userId,
			userName: this.userName
		});
	}

	stopTyping(recipientId: number, propertyId?: number) {
		if (!this.socket || !this.userId) return;

		const roomId = this.getRoomId(this.userId, recipientId, propertyId);
		
		this.socket.emit('typing_stop', {
			roomId,
			userId: this.userId
		});
	}

	markAsRead(roomId: string) {
		if (!this.socket || !this.userId) return;

		this.socket.emit('mark_as_read', { roomId, userId: this.userId });
		
		chatStore.update(state => ({
			...state,
			unreadCounts: new Map(state.unreadCounts).set(roomId, 0)
		}));
	}

	private getRoomId(userId1: number, userId2: number, propertyId?: number): string {
		const sortedIds = [userId1, userId2].sort((a, b) => a - b);
		return propertyId 
			? `property_${propertyId}_${sortedIds[0]}_${sortedIds[1]}`
			: `chat_${sortedIds[0]}_${sortedIds[1]}`;
	}

	getRoomMessages(roomId: string): ChatMessage[] {
		let messages: ChatMessage[] = [];
		chatStore.subscribe(state => {
			messages = state.messages.get(roomId) || [];
		})();
		return messages;
	}
}

export const chatClient = new ChatClient();
