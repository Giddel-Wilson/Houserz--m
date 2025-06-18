import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';

interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isSystemMessage?: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    fullName?: string;
    role: string;
  };
}

interface TypingUser {
  userId: string;
  email: string;
  conversationId: string;
}

// Stores - Export all the stores that components need
export const socketConnected = writable(false);
export const socketMessages = writable<SocketMessage[]>([]);
export const socketError = writable<string | null>(null);
export const typingUsers = writable<TypingUser[]>([]);
export const unreadCounts = writable<Record<string, number>>({});
export const adminNotifications = writable<any[]>([]);

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor() {
    if (browser) {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    this.token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    if (!this.token) {
      console.warn('No auth token found for Socket.IO connection');
      return;
    }

    const socketUrl = import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin;
    
    this.socket = io(socketUrl, {
      auth: {
        token: this.token
      },
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socketConnected.set(true);
      socketError.set(null);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      socketConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      socketError.set(error.message);
      socketConnected.set(false);
    });

    this.socket.on('new_message', (message: SocketMessage) => {
      socketMessages.update(messages => [...messages, message]);
    });

    this.socket.on('user_typing', (data: TypingUser) => {
      typingUsers.update(users => {
        const existingIndex = users.findIndex(u => u.userId === data.userId);
        if (existingIndex >= 0) {
          users[existingIndex] = data;
        } else {
          users.push(data);
        }
        return users;
      });
    });

    this.socket.on('user_stopped_typing', (data: { userId: string; conversationId: string }) => {
      typingUsers.update(users => 
        users.filter(u => !(u.userId === data.userId && u.conversationId === data.conversationId))
      );
    });

    this.socket.on('admin_notification', (notification) => {
      console.log('Admin notification received:', notification);
      adminNotifications.update(notifications => [...notifications, notification]);
    });

    this.socket.on('user_online_status', (data: { userId: number; isOnline: boolean }) => {
      console.log('User online status update:', data);
      // This will be handled by components that subscribe to this event
    });
  }

  public connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public updateToken(newToken: string) {
    this.token = newToken;
    if (this.socket) {
      this.disconnect();
      this.initializeSocket();
      this.connect();
    }
  }

  public joinConversation(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  public sendMessage(conversationId: string, content: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        conversationId,
        content
      });
      return true;
    }
    return false;
  }

  public startTyping(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_start', conversationId);
    }
  }

  public stopTyping(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_stop', conversationId);
    }
  }

  public markConversationAsRead(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark_read', conversationId);
      console.log('Marked conversation as read:', conversationId);
    }
  }

  public leaveConversation(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_conversation', conversationId);
      console.log('Left conversation:', conversationId);
    }
  }

  public getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export types
export type { SocketMessage, TypingUser };
