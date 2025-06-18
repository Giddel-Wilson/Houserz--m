<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { MessageSquare, Search, User, Plus, X } from 'lucide-svelte';
	import { socketService, socketMessages, typingUsers } from '$lib/socket-client';

	interface Participant {
		id: number;
		fullName: string;
		email: string;
		role: 'CLIENT' | 'AGENT';
		profileImage?: string;
		isOnline: boolean;
		company?: string;
		licenseNumber?: string;
		initials?: string;
	}

	interface Conversation {
		id: string;
		participantId: number;
		participantName: string;
		participantRole: 'CLIENT' | 'AGENT';
		lastMessage: string;
		lastMessageTime: string;
		unreadCount: number;
		propertyId?: number;
		propertyTitle?: string;
		isOnline: boolean;
	}

	let user: any = null;
	let conversations: Conversation[] = [];
	let availableParticipants: Participant[] = [];
	let selectedConversation: Conversation | null = null;
	let messages: any[] = [];
	let newMessage = '';
	let searchQuery = '';
	let loading = true;
	let loadingParticipants = false;
	let error = '';
	let showNewChatModal = false;
	let participantSearchQuery = '';
	let isTyping = false;
	let typingTimer: ReturnType<typeof setTimeout> | null = null;
	let creatingConversation = false;

	onMount(() => {
		// Get user data from localStorage (authentication handled by layout)
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (userData) {
			user = JSON.parse(userData);
		}

		// Initialize Socket.IO connection
		socketService.connect();

		loadConversations();
		loadAvailableParticipants();

		// Subscribe to real-time messages and handle online status updates
		const unsubscribeMessages = socketMessages.subscribe((newMessages) => {
			newMessages.forEach(newMsg => {
				// Check if message belongs to current conversation
				if (selectedConversation && newMsg.conversationId === selectedConversation.id) {
					// Check if message already exists (avoid duplicates)
					const existingMessage = messages.find(m => m.id === newMsg.id);
					if (!existingMessage) {
						messages = [...messages, {
							...newMsg,
							createdAt: newMsg.createdAt // Ensure proper timestamp format
						}];
						
						// Update conversation's last message
						conversations = conversations.map(conv => 
							conv.id === selectedConversation.id 
								? { 
									...conv, 
									lastMessage: newMsg.content, 
									lastMessageTime: newMsg.createdAt 
								}
								: conv
						);
					}
				} else {
					// Update other conversations' unread counts and last messages
					conversations = conversations.map(conv => 
						conv.id === newMsg.conversationId 
							? { 
								...conv, 
								lastMessage: newMsg.content, 
								lastMessageTime: newMsg.createdAt,
								unreadCount: conv.unreadCount + 1
							}
							: conv
					);
				}
			});
		});

		// Handle online status changes via Socket.IO
		socketService.socket?.on('user_online_status', (data: { userId: number; isOnline: boolean }) => {
			conversations = conversations.map(conv => 
				conv.participantId === data.userId 
					? { ...conv, isOnline: data.isOnline }
					: conv
			);
			
			// Update selected conversation if it's the same user
			if (selectedConversation && selectedConversation.participantId === data.userId) {
				selectedConversation = { ...selectedConversation, isOnline: data.isOnline };
			}
		});
		
		return () => {
			unsubscribeMessages();
			unsubscribeTyping();
		};
	});

	onDestroy(() => {
		socketService.disconnect();
	});

	function formatTime(timeString: string): string {
		try {
			// Handle various timestamp formats
			const date = new Date(timeString);
			
			// Check if date is valid
			if (isNaN(date.getTime())) {
				console.warn('Invalid date string:', timeString);
				return 'Just now';
			}

			const now = new Date();
			const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
			
			if (diffInMinutes < 1) return 'Just now';
			if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
			if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
			
			// For older messages, show actual time
			return date.toLocaleTimeString('en-US', { 
				hour: 'numeric', 
				minute: '2-digit',
				hour12: true 
			});
		} catch (error) {
			console.error('Error formatting time:', error, timeString);
			return 'Recently';
		}
	}

	async function loadConversations() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/conversations', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				
				// Map the API response to our expected format
				conversations = (data.conversations || []).map((conv: any) => ({
					id: conv.id.toString(),
					participantId: conv.participantId,
					participantName: conv.participantName,
					participantRole: conv.participantRole,
					lastMessage: conv.lastMessage,
					lastMessageTime: conv.lastMessageTime,
					unreadCount: conv.unreadCount || 0,
					propertyId: conv.propertyId,
					propertyTitle: conv.propertyTitle,
					isOnline: conv.isOnline || false
				}));
			} else {
				console.error('Failed to load conversations:', response.status);
				conversations = [];
			}
		} catch (err) {
			console.error('Error loading conversations:', err);
			error = 'Failed to load conversations';
			conversations = [];
		} finally {
			loading = false;
		}
	}

	async function loadAvailableParticipants() {
		try {
			loadingParticipants = true;
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/participants', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				availableParticipants = (data.participants || []).map((p: any) => ({
					...p,
					initials: p.fullName ? p.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : p.email[0].toUpperCase()
				}));
			} else {
				console.error('Failed to load participants:', response.status);
				availableParticipants = [];
			}
		} catch (error) {
			console.error('Error loading participants:', error);
			availableParticipants = [];
		} finally {
			loadingParticipants = false;
		}
	}

	async function startNewConversation(participant: Participant) {
		try {
			creatingConversation = true;
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/conversation', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					participantId: participant.id,
					subject: `Chat with ${participant.fullName || participant.email}`
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				const conversation = data.conversation;
				
				// Convert to our conversation format and add to list
				const newConv: Conversation = {
					id: conversation.id.toString(),
					participantId: participant.id,
					participantName: participant.fullName || participant.email,
					participantRole: participant.role,
					lastMessage: 'Conversation started',
					lastMessageTime: conversation.createdAt,
					unreadCount: 0,
					propertyId: conversation.propertyId,
					propertyTitle: conversation.property?.title,
					isOnline: participant.isOnline
				};
				
				// Add to conversations list if not already there
				const existingIndex = conversations.findIndex(c => c.id === newConv.id);
				if (existingIndex === -1) {
					conversations = [newConv, ...conversations];
				} else {
					conversations[existingIndex] = newConv;
				}
				
				showNewChatModal = false;
				await selectConversation(newConv);
				
			} else {
				console.error('Failed to create conversation:', response.status);
			}
		} catch (error) {
			console.error('Error creating conversation:', error);
		} finally {
			creatingConversation = false;
		}
	}

	async function selectConversation(conversation: Conversation) {
		selectedConversation = conversation;
		
		// Join conversation room via Socket.IO
		socketService.joinConversation(conversation.id);
		
		// Load conversation messages
		await loadMessages(conversation.id);
		
		// Mark conversation as read
		socketService.markConversationAsRead(conversation.id);
		
		// Update unread count
		conversation.unreadCount = 0;
		conversations = conversations;
	}

	async function loadMessages(conversationId: string) {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/messages/${conversationId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				
				// Ensure messages have proper timestamp formatting
				messages = (data.messages || []).map((msg: any) => ({
					...msg,
					createdAt: msg.createdAt
				}));
			} else {
				console.error('Failed to load messages:', response.status);
				messages = [];
			}
		} catch (error) {
			console.error('Error loading messages:', error);
			messages = [];
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !selectedConversation) return;

		const messageContent = newMessage.trim();
		const tempMessage = {
			id: Date.now().toString(),
			conversationId: selectedConversation.id,
			senderId: user.id,
			content: messageContent,
			createdAt: new Date().toISOString(),
			isRead: false,
			sender: {
				id: user.id,
				fullName: user.fullName || user.email,
				email: user.email,
				role: user.role
			}
		};

		// Add message immediately to UI (optimistic update)
		messages = [...messages, tempMessage];
		newMessage = '';

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/messages/${selectedConversation.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					content: messageContent
				})
			});

			if (!response.ok) {
				console.error('Failed to send message:', response.status);
				// Remove the optimistic message on failure
				messages = messages.filter(m => m.id !== tempMessage.id);
			}
		} catch (error) {
			console.error('Error sending message:', error);
			// Remove the optimistic message on failure
			messages = messages.filter(m => m.id !== tempMessage.id);
		}

		// Stop typing indicator
		if (isTyping) {
			socketService.stopTyping(selectedConversation.id);
			isTyping = false;
		}
	}

	function handleTyping() {
		if (!selectedConversation) return;

		if (!isTyping) {
			isTyping = true;
			socketService.startTyping(selectedConversation.id);
		}

		// Reset typing timer
		if (typingTimer) {
			clearTimeout(typingTimer);
		}

		typingTimer = setTimeout(() => {
			if (isTyping) {
				isTyping = false;
				socketService.stopTyping(selectedConversation.id);
			}
		}, 2000);
	}

	$: filteredConversations = conversations.filter(conv =>
		conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		conv.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	$: filteredParticipants = availableParticipants.filter(participant =>
		(participant.fullName && participant.fullName.toLowerCase().includes(participantSearchQuery.toLowerCase())) ||
		participant.email.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
		(participant.company && participant.company.toLowerCase().includes(participantSearchQuery.toLowerCase()))
	);

	$: totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
</script>

<svelte:head>
	<title>Messages - Houserz Client</title>
</svelte:head>

<div class="h-screen bg-gray-50 flex">
	<!-- Conversations Sidebar -->
	<div class="w-80 bg-white border-r border-gray-200 flex flex-col">
		<!-- Header -->
		<div class="p-4 border-b border-gray-200">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-xl font-semibold text-gray-900">Messages</h1>
				<div class="flex items-center space-x-2">
					<button 
						on:click={() => showNewChatModal = true}
						class="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
						title="Start new chat"
					>
						<Plus class="h-5 w-5" />
					</button>
					{#if totalUnreadCount > 0}
						<span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
							{totalUnreadCount}
						</span>
					{/if}
				</div>
			</div>
			
			<!-- Search -->
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search conversations..."
					class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<Search class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
			</div>
		</div>

		<!-- Conversations List -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="flex justify-center items-center h-32">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				</div>
			{:else if error}
				<div class="p-4 text-red-600 text-center">{error}</div>
			{:else if filteredConversations.length === 0}
				<div class="p-4 text-gray-500 text-center">
					{searchQuery ? 'No conversations found' : 'No conversations yet'}
				</div>
			{:else}
				{#each filteredConversations as conversation}
					<button
						on:click={() => selectConversation(conversation)}
						class="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 flex items-start space-x-3 {selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}"
					>
						<!-- Avatar -->
						<div class="relative flex-shrink-0">
							<div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
								<User class="w-6 h-6 text-gray-600" />
							</div>
							{#if conversation.isOnline}
								<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
							{/if}
						</div>

						<!-- Conversation Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-1">
								<h3 class="font-medium text-gray-900 truncate">
									{conversation.participantName}
								</h3>
								<span class="text-xs text-gray-500">
									{formatTime(conversation.lastMessageTime)}
								</span>
							</div>
							
							{#if conversation.propertyTitle}
								<div class="text-xs text-blue-600 mb-1 truncate">
									{conversation.propertyTitle}
								</div>
							{/if}
							
							<div class="flex items-center justify-between">
								<p class="text-sm text-gray-600 truncate">
									{conversation.lastMessage}
								</p>
								{#if conversation.unreadCount > 0}
									<span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2">
										{conversation.unreadCount}
									</span>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Chat Area -->
	<div class="flex-1 flex flex-col min-h-0">
		{#if selectedConversation}
			<!-- Chat Header -->
			<div class="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
				<div class="flex items-center space-x-3">
					<div class="relative">
						<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
							<User class="w-5 h-5 text-gray-600" />
						</div>
						{#if selectedConversation.isOnline}
							<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
						{/if}
					</div>
					<div>
						<h2 class="font-medium text-gray-900">{selectedConversation.participantName}</h2>
						<div class="flex items-center space-x-2 text-sm text-gray-500">
							<span>{selectedConversation.isOnline ? 'Online' : 'Offline'}</span>
							{#if selectedConversation.propertyTitle}
								<span>•</span>
								<span class="text-blue-600">Re: {selectedConversation.propertyTitle}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center space-x-2">
					<button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
						<Phone class="w-5 h-5" />
					</button>
					<button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
						<Video class="w-5 h-5" />
					</button>
				</div>
			</div>

			<!-- Chat Messages Container -->
			<div class="flex-1 flex flex-col bg-gray-50 min-h-0">
				<!-- Messages Area -->
				<div class="flex-1 overflow-y-auto p-4 space-y-4">
					{#if messages.length === 0}
						<div class="flex items-center justify-center h-full">
							<div class="text-center">
								<MessageSquare class="w-12 h-12 text-gray-300 mx-auto mb-3" />
								<p class="text-gray-500 text-sm">No messages yet</p>
								<p class="text-gray-400 text-xs mt-1">Start the conversation by sending a message</p>
							</div>
						</div>
					{:else}
						{#each messages as message}
							<div class="flex {message.senderId === user.id ? 'justify-end' : 'justify-start'}">
								<div class="max-w-xs lg:max-w-md">
									<div class="
										{message.senderId === user.id 
											? 'bg-blue-600 text-white' 
											: 'bg-white text-gray-900 border border-gray-200'
										} 
										rounded-lg px-4 py-2 shadow-sm
									">
										<p class="text-sm">{message.content}</p>
									</div>
									<div class="flex {message.senderId === user.id ? 'justify-end' : 'justify-start'} mt-1">
										<span class="text-xs text-gray-500">
											{formatTime(message.createdAt)}
										</span>
									</div>
								</div>
							</div>
						{/each}
					{/if}
					
					<!-- Typing indicator -->
					{#if $typingUsers.length > 0}
						<div class="flex justify-start">
							<div class="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
									<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
									<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
								</div>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Message Input - Always visible at bottom -->
				<div class="bg-white border-t border-gray-200 p-4 flex-shrink-0">
					<form on:submit|preventDefault={sendMessage} class="flex space-x-3">
						<input
							type="text"
							bind:value={newMessage}
							on:input={handleTyping}
							placeholder="Type a message..."
							class="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
							autocomplete="off"
						/>
						<button
							type="submit"
							disabled={!newMessage.trim()}
							class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
						>
							Send
						</button>
					</form>
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<div class="flex-1 flex items-center justify-center bg-gray-50">
				<div class="text-center">
					<MessageSquare class="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
					<p class="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- New Chat Modal -->
{#if showNewChatModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">Start New Chat</h3>
					<button 
						on:click={() => showNewChatModal = false}
						class="text-gray-400 hover:text-gray-600"
						disabled={creatingConversation}
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
			
			<div class="px-6 py-4">
				<!-- Search Bar -->
				<div class="relative mb-4">
					<input
						type="text"
						bind:value={participantSearchQuery}
						placeholder="Search users..."
						disabled={creatingConversation}
						class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
					<Search class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
				</div>

				{#if creatingConversation}
					<!-- Loading State -->
					<div class="flex flex-col items-center justify-center py-12">
						<div class="relative">
							<div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
							<div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
						</div>
						<p class="text-gray-600 mt-4 font-medium">Creating conversation...</p>
						<p class="text-gray-400 text-sm mt-1">Please wait a moment</p>
					</div>
				{:else if loadingParticipants}
					<div class="flex items-center justify-center py-8">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						<span class="ml-2 text-gray-600">Loading users...</span>
					</div>
				{:else if filteredParticipants.length === 0}
					<div class="text-center py-8">
						<User class="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<p class="text-gray-500">
							{participantSearchQuery ? 'No users found' : 'No users available'}
						</p>
						{#if participantSearchQuery}
							<p class="text-sm text-gray-400 mt-1">Try adjusting your search</p>
						{/if}
					</div>
				{:else}
					<div class="space-y-2 max-h-64 overflow-y-auto">
						{#each filteredParticipants as participant}
							<button
								on:click={() => startNewConversation(participant)}
								disabled={creatingConversation}
								class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
							>
								<div class="relative flex-shrink-0">
									{#if participant.profileImage}
										<img 
											src={participant.profileImage} 
											alt={participant.fullName}
											class="w-10 h-10 rounded-full object-cover"
										/>
									{:else}
										<div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium {
											participant.role === 'AGENT' ? 'bg-purple-500' : 'bg-green-500'
										}">
											{participant.initials || participant.email[0].toUpperCase()}
										</div>
									{/if}
									{#if participant.isOnline}
										<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between">
										<p class="font-medium text-gray-900 truncate">
											{participant.fullName || participant.email}
										</p>
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {
											participant.role === 'AGENT' 
												? 'bg-purple-100 text-purple-800' 
												: 'bg-green-100 text-green-800'
										}">
											{participant.role === 'AGENT' ? 'Agent' : 'Client'}
										</span>
									</div>
									<p class="text-sm text-gray-500 truncate">
										{#if participant.role === 'AGENT' && participant.company}
											{participant.company}
										{:else if participant.role === 'AGENT'}
											Real Estate Agent
										{:else}
											Property Buyer/Renter
										{/if}
									</p>
									{#if participant.role === 'AGENT' && participant.licenseNumber}
										<p class="text-xs text-gray-400 truncate">
											License: {participant.licenseNumber}
										</p>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Hide scrollbar but keep functionality */
	.overflow-y-auto::-webkit-scrollbar {
		width: 0px;
		background: transparent;
	}
</style>