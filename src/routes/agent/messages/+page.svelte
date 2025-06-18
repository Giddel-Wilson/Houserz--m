<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Send,
		Search,
		Phone,
		Video,
		MoreVertical,
		Paperclip,
		Smile,
		MessageSquare,
		User,
		Menu,
		X,
		Check,
		CheckCheck,
		Info,
		Plus
	} from 'lucide-svelte';
	import {
		socketService,
		socketConnected,
		socketMessages,
		socketError,
		typingUsers,
		unreadCounts
	} from '$lib/socket-client';

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
	let conversations: any[] = [];
	let availableParticipants: any[] = [];
	let selectedConversation: any = null;
	let messages: any[] = [];
	let newMessage = '';
	let searchTerm = '';
	let loading = true;
	let loadingParticipants = false;
	let sidebarOpen = false;
	let error = '';
	let showNewChatModal = false;
	let participantSearchQuery = '';
	let isTyping = false;
	let typingTimer: ReturnType<typeof setTimeout> | null = null;
	let fileInput: HTMLInputElement;
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
		loadAvailableParticipants(); // Add this line

		// Subscribe to real-time messages
		const unsubscribeMessages = socketMessages.subscribe((newMessages) => {
			newMessages.forEach((newMsg) => {
				if (selectedConversation && newMsg.conversationId === selectedConversation.id) {
					const existingMessage = messages.find((m) => m.id === newMsg.id);
					if (!existingMessage) {
						messages = [
							...messages,
							{
								...newMsg,
								timestamp: newMsg.createdAt,
								createdAt: newMsg.createdAt
							}
						];
					}
				}

				// Update conversations
				conversations = conversations.map((conv) =>
					conv.id === newMsg.conversationId
						? {
								...conv,
								lastMessage: newMsg.content,
								lastMessageAt: newMsg.createdAt
							}
						: conv
				);
			});
		});

		return () => {
			unsubscribeMessages();
		};
	});

	onDestroy(() => {
		socketService.disconnect();
	});

	function formatTime(timestamp: string) {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(timestamp: string) {
		const date = new Date(timestamp);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString();
		}
	}

	function getMessageStatus(message: any) {
		if (message.senderId !== user.id) return null;
		return message.status || 'sent';
	}

	function triggerFileUpload() {
		fileInput?.click();
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			const file = files[0];
			console.log('File selected:', file.name);
		}
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		goto('/');
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	async function loadConversations() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/conversations', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			console.log('Conversations API response status:', response.status);

			if (response.ok) {
				const data = await response.json();
				console.log('Conversations API response data:', data);
				
				// Map the API response to our expected format
				conversations = (data.conversations || []).map((conv: any) => {
					// Determine who is the other participant
					const isInitiator = conv.initiatorId === user.id;
					const otherParticipant = isInitiator ? conv.receiver : conv.initiator;
					
					// Get the most recent message
					const lastMessage = conv.messages && conv.messages.length > 0 ? 
						conv.messages[conv.messages.length - 1] : null;
					
					return {
						id: conv.id.toString(),
						subject: conv.subject || 'Chat',
						lastMessage: lastMessage?.content || 'No messages yet',
						lastMessageAt: lastMessage?.createdAt || conv.createdAt,
						unreadCount: 0,
						participants: [
							{
								id: user.id,
								fullName: user.full_name || user.fullName || user.name,
								isOnline: true
							},
							{
								id: otherParticipant?.id,
								fullName: otherParticipant?.full_name || otherParticipant?.fullName || otherParticipant?.name || 'Unknown Client',
								role: otherParticipant?.role,
								isOnline: otherParticipant?.isOnline || false
							}
						],
						propertyId: conv.propertyId,
						propertyTitle: conv.property?.title,
						canReceiverReply: true
					};
				});
				
				console.log('Processed conversations:', conversations);
			} else {
				const errorText = await response.text();
				console.error('Failed to load conversations:', response.status, errorText);
				conversations = [];
			}
		} catch (err) {
			console.error('Error loading conversations:', err);
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
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				// Filter to show only clients for agents
				availableParticipants = (data.participants || [])
					.filter((p: any) => p.role === 'CLIENT')
					.map((p: any) => ({
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

	async function loadMessages(conversationId: string) {
		try {
			console.log('Loading messages for conversation:', conversationId);
			const token = localStorage.getItem('token');
			const response = await fetch(`/api/messages/${conversationId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			console.log('Messages API response status:', response.status);

			if (response.ok) {
				const data = await response.json();
				console.log('Messages API response data:', data);
				
				// Ensure messages have proper timestamp formatting
				messages = (data.messages || []).map((msg: any) => ({
					...msg,
					timestamp: msg.createdAt || msg.timestamp,
					senderId: msg.senderId
				}));
				
				console.log('Processed messages:', messages);
			} else {
				const errorText = await response.text();
				console.error('Failed to load messages:', response.status, errorText);
				messages = [];
			}
		} catch (error) {
			console.error('Error loading messages:', error);
			messages = [];
		}
	}

	async function selectConversation(conversation: any) {
		console.log('Selecting conversation:', conversation);
		selectedConversation = conversation;
		
		// Join conversation room via Socket.IO
		socketService.joinConversation(conversation.id.toString());
		
		// Load conversation messages
		await loadMessages(conversation.id.toString());
		
		// Mark conversation as read
		socketService.markConversationAsRead(conversation.id.toString());
	}

	async function startNewConversation(participant: any) {
		try {
			creatingConversation = true;
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/conversation', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					participantId: participant.id,
					subject: `Chat with ${participant.fullName || participant.email}`
				})
			});

			if (response.ok) {
				const data = await response.json();
				const conversation = data.conversation;
				
				// Transform to our format
				const newConv = {
					id: conversation.id.toString(),
					subject: conversation.subject,
					lastMessage: 'Conversation started',
					lastMessageAt: conversation.createdAt,
					unreadCount: 0,
					participants: [
						{
							id: user.id,
							fullName: user.fullName || user.name,
							isOnline: true
						},
						{
							id: participant.id,
							fullName: participant.fullName || participant.email,
							role: participant.role,
							isOnline: participant.isOnline
						}
					],
					propertyId: conversation.propertyId,
					propertyTitle: conversation.property?.title,
					canReceiverReply: true
				};
				
				// Add to conversations list if not already there
				const existingIndex = conversations.findIndex(c => c.id === newConv.id);
				if (existingIndex === -1) {
					conversations = [newConv, ...conversations];
				} else {
					conversations[existingIndex] = newConv;
				}
				
				// Select the conversation
				selectedConversation = newConv;
				socketService.joinConversation(newConv.id.toString());
				await loadMessages(newConv.id.toString());
				
				showNewChatModal = false;
			} else {
				console.error('Failed to create conversation:', response.status);
			}
		} catch (error) {
			console.error('Error creating conversation:', error);
		} finally {
			creatingConversation = false;
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !selectedConversation) return;

		const messageContent = newMessage.trim();
		const tempMessage = {
			id: Date.now(),
			conversationId: selectedConversation.id.toString(),
			senderId: user.id,
			content: messageContent,
			timestamp: new Date().toISOString(),
			createdAt: new Date().toISOString(),
			sender: {
				id: user.id,
				fullName: user.fullName || user.full_name || user.name || user.email,
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
					Authorization: `Bearer ${token}`
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
			socketService.stopTyping(selectedConversation.id.toString());
			isTyping = false;
		}
	}

	function handleTyping() {
		if (!selectedConversation) return;

		if (!isTyping) {
			isTyping = true;
			socketService.startTyping(selectedConversation.id.toString());
		}

		// Reset typing timer
		if (typingTimer) {
			clearTimeout(typingTimer);
		}

		typingTimer = setTimeout(() => {
			if (isTyping) {
				isTyping = false;
				socketService.stopTyping(selectedConversation.id.toString());
			}
		}, 2000);
	}

	$: filteredConversations = conversations.filter((conv) => {
		if (!searchTerm) return true;

		const otherParticipant = conv.participants?.find((p: any) => p.id !== user.id);
		if (!otherParticipant) return false;

		return (
			otherParticipant.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conv.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	$: filteredParticipants = availableParticipants.filter(
		(participant) =>
			(participant.fullName &&
				participant.fullName.toLowerCase().includes(participantSearchQuery.toLowerCase())) ||
			(participant.full_name &&
				participant.full_name.toLowerCase().includes(participantSearchQuery.toLowerCase())) ||
			participant.email.toLowerCase().includes(participantSearchQuery.toLowerCase())
	);
</script>

<svelte:head>
	<title>Messages - Houserz Agent</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
	<div class="flex h-screen">
		<!-- Chat Interface -->
		<div class="flex flex-1 bg-white">
			<!-- Conversations List -->
			<div
				class="flex w-full flex-col border-r border-gray-200 bg-white md:w-80 lg:w-96 {selectedConversation
					? 'hidden md:flex'
					: 'flex'}"
			>
				<!-- Header -->
				<div class="border-b border-gray-200 bg-white px-6 py-4">
					<div class="mb-4 flex items-center justify-between">
						<h1 class="text-xl font-semibold text-gray-900 ml-10 lg:ml-0">Messages</h1>
						<div class="flex items-center space-x-2">
							<button
								on:click={() => (showNewChatModal = true)}
								class="rounded-lg p-2 text-green-600 hover:bg-green-50 hover:text-green-700"
								title="Start new chat"
							>
								<Plus class="h-5 w-5" />
							</button>
							<button class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
								<MoreVertical class="h-5 w-5" />
							</button>
						</div>
					</div>
					<div class="relative">
						<Search
							class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
						/>
						<input
							type="text"
							placeholder="Search conversations..."
							bind:value={searchTerm}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				<!-- Conversations -->
				<div class="flex-1 overflow-y-auto w-screen lg:w-auto">
					{#if loading}
						<div class="flex items-center justify-center py-12">
							<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
						</div>
					{:else if filteredConversations.length === 0}
						<div class="flex flex-col items-center justify-center px-6 py-12 text-center">
							<MessageSquare class="mb-4 h-16 w-16 text-gray-300" />
							<h3 class="mb-2 text-lg font-medium text-gray-900">No conversations yet</h3>
							<p class="text-sm text-gray-500">Start a conversation with a client</p>
						</div>
					{:else}
						{#each filteredConversations as conversation}
							<button
								on:click={() => selectConversation(conversation)}
								class="w-full border-b border-gray-100 px-6 py-4 text-left transition-colors hover:bg-gray-50 {selectedConversation?.id ===
								conversation.id
									? 'border-green-200 bg-green-50'
									: ''}"
							>
								<div class="flex items-start space-x-3">
									<div class="relative flex-shrink-0">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm"
										>
											<span class="text-sm font-semibold text-white">
												{conversation.participants
													.find((p: any) => p.id !== user.id)
													?.fullName?.charAt(0) || 'C'}
											</span>
										</div>
										{#if conversation.participants.find((p: any) => p.id !== user.id)?.isOnline}
											<div
												class="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-400"
											></div>
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<div class="mb-1 flex items-center justify-between">
											<p class="truncate text-sm font-semibold text-gray-900">
												{conversation.participants.find((p: any) => p.id !== user.id)?.fullName ||
													'Client'}
											</p>
											<span class="text-xs text-gray-500">
												{conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ''}
											</span>
										</div>
										{#if conversation.propertyTitle}
											<div class="mb-1 truncate text-xs font-medium">
												<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full">
													Property: {conversation.propertyTitle}
												</span>
											</div>
										{/if}
										<p class="truncate text-sm text-gray-600">
											{conversation.lastMessage || 'No messages yet'}
										</p>
										{#if conversation.unreadCount > 0}
											<div class="mt-2 flex items-center justify-between">
												<span></span>
												<span
													class="min-w-[20px] rounded-full bg-green-500 px-2 py-1 text-center text-xs text-white"
												>
													{conversation.unreadCount}
												</span>
											</div>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Chat Area -->
			{#if selectedConversation}
				<div
					class="flex flex-1 flex-col bg-white {selectedConversation ? 'flex' : 'hidden md:flex'}"
				>
					<!-- Chat Header -->
					<div class="border-b border-gray-200 bg-white px-6 py-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<button
									class="p-2 text-gray-400 hover:text-gray-600 md:hidden"
									on:click={() => (selectedConversation = null)}
								>
									<X class="h-5 w-5" />
								</button>
								<div class="relative">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600"
									>
										<span class="text-sm font-medium text-white">
											{selectedConversation.participants
												.find((p: any) => p.id !== user.id)
												?.fullName?.charAt(0) || 'C'}
										</span>
									</div>
									{#if selectedConversation.participants.find((p: any) => p.id !== user.id)?.isOnline}
										<div
											class="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400"
										></div>
									{/if}
								</div>
								<div>
									<h2 class="text-lg font-semibold text-gray-900">
										{selectedConversation.participants.find((p: any) => p.id !== user.id)
											?.fullName || 'Client'}
									</h2>
									<p class="text-sm text-gray-500">
										{selectedConversation.participants.find((p: any) => p.id !== user.id)?.isOnline
											? 'Online'
											: 'Last seen recently'}
										{#if selectedConversation.propertyTitle}
											• <a href="/agent/properties/{selectedConversation.propertyId}" class="text-green-600 hover:underline font-medium">
												{selectedConversation.propertyTitle}
											</a>
										{/if}
									</p>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								<button class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
									<Phone class="h-5 w-5 hidden lg:block" />
								</button>
								<button class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
									<Video class="h-5 w-5 hidden lg:block" />
								</button>
								<button class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
									<MoreVertical class="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>

					<!-- Messages -->
					<div class="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-6">
						{#if messages.length === 0}
							<div class="flex h-full items-center justify-center">
								<div class="text-center">
									<MessageSquare class="mx-auto mb-3 h-12 w-12 text-gray-300" />
									<p class="text-sm text-gray-500">No messages yet</p>
									<p class="mt-1 text-xs text-gray-400">
										Start the conversation by sending a message
									</p>
								</div>
							</div>
						{:else}
							{#each messages as message, index}
								{#if index === 0 || formatDate(messages[index - 1].timestamp || messages[index - 1].createdAt) !== formatDate(message.timestamp || message.createdAt)}
									<div class="my-4 flex justify-center">
										<span class="rounded-full bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
											{formatDate(message.timestamp || message.createdAt)}
										</span>
									</div>
								{/if}

								<div class="flex {message.senderId === user.id ? 'justify-end' : 'justify-start'}">
									<div class="max-w-xs lg:max-w-md">
										{#if message.senderId !== user.id}
											<div class="flex items-end space-x-2">
												<div
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600"
												>
													<span class="text-xs font-medium text-white">
														{message.sender?.fullName?.charAt(0) || message.sender?.full_name?.charAt(0) || 'C'}
													</span>
												</div>
												<div class="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
													<p class="text-sm text-gray-900">{message.content}</p>
													<p class="mt-1 text-xs text-gray-500">
														{formatTime(message.timestamp || message.createdAt)}
													</p>
												</div>
											</div>
										{:else}
											<div
												class="rounded-2xl rounded-br-md bg-green-500 px-4 py-3 text-white shadow-sm"
											>
												<p class="text-sm">{message.content}</p>
												<div class="mt-1 flex items-center justify-end space-x-1">
													<span class="text-xs text-green-100"
														>{formatTime(message.timestamp || message.createdAt)}</span
													>
													<div class="flex items-center">
														{#if getMessageStatus(message) === 'sent'}
															<Check class="h-3 w-3 text-green-100" />
														{:else if getMessageStatus(message) === 'delivered'}
															<CheckCheck class="h-3 w-3 text-green-100" />
														{:else if getMessageStatus(message) === 'read'}
															<CheckCheck class="h-3 w-3 text-white" />
														{/if}
													</div>
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						{/if}

						{#if $typingUsers.length > 0}
							<div class="flex justify-start">
								<div class="flex items-end space-x-2">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600"
									>
										<span class="text-xs text-white">C</span>
									</div>
									<div class="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
										<div class="flex space-x-1">
											<div class="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
											<div
												class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
												style="animation-delay: 0.1s"
											></div>
											<div
												class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
												style="animation-delay: 0.2s"
											></div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Message Input -->
					<div class="border-t border-gray-200 bg-white px-6 py-4">
						<form on:submit|preventDefault={sendMessage} class="flex items-end space-x-3">
							<input
								type="file"
								bind:this={fileInput}
								on:change={handleFileSelect}
								class="hidden"
								accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
							/>
							<button
								type="button"
								on:click={triggerFileUpload}
								class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<Paperclip class="h-5 w-5" />
							</button>
							<div class="relative flex-1">
								<input
									type="text"
									bind:value={newMessage}
									on:input={handleTyping}
									placeholder="Type a message..."
									class="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 focus:border-transparent focus:ring-2 focus:ring-green-500"
								/>
								<button
									type="button"
									class="absolute top-1/2 right-3 -translate-y-1/2 transform p-1 text-gray-400 hover:text-gray-600"
								>
									<Smile class="h-5 w-5" />
								</button>
							</div>
							<button
								type="submit"
								disabled={!newMessage.trim()}
								class="rounded-2xl bg-green-500 p-3 text-white shadow-sm transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Send class="h-5 w-5" />
							</button>
						</form>
					</div>
				</div>
			{:else}
				<div class="hidden flex-1 items-center justify-center bg-gray-50 md:flex">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
						>
							<MessageSquare class="h-12 w-12 text-green-500" />
						</div>
						<h3 class="mb-2 text-xl font-semibold text-gray-900">Welcome to Agent Messages</h3>
						<p class="max-w-md text-gray-600">
							Select a conversation from the sidebar to start chatting with your clients
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- New Chat Modal -->
{#if showNewChatModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		on:click={() => (showNewChatModal = false)}
	>
		<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl" on:click|stopPropagation>
			<div class="border-b border-gray-200 px-6 py-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">Start New Chat</h3>
					<button
						on:click={() => (showNewChatModal = false)}
						class="text-gray-400 hover:text-gray-600"
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
						placeholder="Search clients..."
						class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
					/>
					<Search class="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
				</div>

				{#if creatingConversation}
					<div class="flex items-center justify-center py-8">
						<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
					</div>
				{:else if loadingParticipants}
					<div class="flex items-center justify-center py-8">
						<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
					</div>
				{:else if filteredParticipants.length === 0}
					<div class="py-8 text-center">
						<User class="mx-auto mb-4 h-12 w-12 text-gray-300" />
						<p class="text-gray-500">
							{participantSearchQuery ? 'No clients found' : 'No clients available'}
						</p>
						{#if participantSearchQuery}
							<p class="text-sm text-gray-400 mt-1">Try adjusting your search</p>
						{/if}
					</div>
				{:else}
					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each filteredParticipants as participant}
							<button
								on:click={() => startNewConversation(participant)}
								disabled={creatingConversation}
								class="flex w-full items-center space-x-3 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
							>
								<div class="relative flex-shrink-0">
									{#if participant.profileImage}
										<img 
											src={participant.profileImage} 
											alt={participant.fullName}
											class="w-10 h-10 rounded-full object-cover"
										/>
									{:else}
										<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
											<span class="text-sm font-medium text-white">
												{(participant.fullName || participant.full_name || participant.email)[0].toUpperCase()}
											</span>
										</div>
									{/if}
									{#if participant.isOnline}
										<div class="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between">
										<p class="truncate font-medium text-gray-900">
											{participant.fullName || participant.full_name || participant.email}
										</p>
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
											Client
										</span>
									</div>
									<p class="text-sm text-gray-500 truncate">
										{participant.email}
									</p>
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
