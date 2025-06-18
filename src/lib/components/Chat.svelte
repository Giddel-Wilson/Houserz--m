<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Send, Phone, Video, MoreVertical, X } from 'lucide-svelte';
	import { chatClient, chatStore } from '$lib/chat-client';
	import type { ChatMessage } from '$lib/chat-server';

	export let recipientId: number;
	export let recipientName: string;
	export let propertyId: number | undefined = undefined;
	export let onClose: (() => void) | undefined = undefined;

	let messageInput = '';
	let chatContainer: HTMLElement;
	let user: any = null;
	let roomId = '';
	let messages: ChatMessage[] = [];
	let typingUsers: string[] = [];
	let typingTimeout: number | null = null;

	onMount(() => {
		// Get current user
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
			
			// Connect to chat if not already connected
			if (user) {
				chatClient.connect(user.id, user.full_name, user.role);
				
				// Generate room ID
				roomId = getRoomId(user.id, recipientId, propertyId);
				chatClient.joinRoom(roomId);
			}
		}

		// Subscribe to chat store updates
		const unsubscribe = chatStore.subscribe((state) => {
			messages = state.messages.get(roomId) || [];
			const typingInRoom = state.typingUsers.get(roomId) || new Set();
			typingUsers = Array.from(typingInRoom).filter(name => name !== user?.full_name);
			
			// Scroll to bottom when new messages arrive
			setTimeout(() => scrollToBottom(), 100);
		});

		return () => {
			unsubscribe();
			if (typingTimeout) clearTimeout(typingTimeout);
		};
	});

	onDestroy(() => {
		if (typingTimeout) clearTimeout(typingTimeout);
	});

	function getRoomId(userId1: number, userId2: number, propertyId?: number): string {
		const sortedIds = [userId1, userId2].sort((a, b) => a - b);
		return propertyId 
			? `property_${propertyId}_${sortedIds[0]}_${sortedIds[1]}`
			: `chat_${sortedIds[0]}_${sortedIds[1]}`;
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	function sendMessage() {
		if (!messageInput.trim() || !user) return;

		chatClient.sendMessage(recipientId, messageInput.trim(), propertyId);
		messageInput = '';
		
		// Stop typing indicator
		chatClient.stopTyping(recipientId, propertyId);
		if (typingTimeout) {
			clearTimeout(typingTimeout);
			typingTimeout = null;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function handleTyping() {
		if (!user) return;

		// Send typing indicator
		chatClient.startTyping(recipientId, propertyId);

		// Clear existing timeout
		if (typingTimeout) clearTimeout(typingTimeout);

		// Set new timeout to stop typing indicator
		typingTimeout = setTimeout(() => {
			chatClient.stopTyping(recipientId, propertyId);
			typingTimeout = null;
		}, 2000);
	}

	function formatTime(timestamp: Date | string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: true 
		});
	}

	function formatDate(timestamp: Date | string): string {
		const date = new Date(timestamp);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString('en-US', { 
				month: 'short', 
				day: 'numeric',
				year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
			});
		}
	}

	function shouldShowDateHeader(index: number): boolean {
		if (index === 0) return true;
		
		const currentMessage = messages[index];
		const previousMessage = messages[index - 1];
		
		const currentDate = new Date(currentMessage.timestamp).toDateString();
		const previousDate = new Date(previousMessage.timestamp).toDateString();
		
		return currentDate !== previousDate;
	}
</script>

<div class="flex flex-col h-full bg-white rounded-lg shadow-lg">
	<!-- Chat Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200">
		<div class="flex items-center">
			<div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
				{recipientName.charAt(0).toUpperCase()}
			</div>
			<div class="ml-3">
				<h3 class="text-lg font-semibold text-gray-900">{recipientName}</h3>
				{#if propertyId}
					<p class="text-sm text-gray-500">Property Inquiry</p>
				{/if}
			</div>
		</div>
		<div class="flex items-center space-x-2">
			<button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
				<Phone class="w-5 h-5" />
			</button>
			<button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
				<Video class="w-5 h-5" />
			</button>
			<button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
				<MoreVertical class="w-5 h-5" />
			</button>
			{#if onClose}
				<button 
					on:click={onClose}
					class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
				>
					<X class="w-5 h-5" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Messages Container -->
	<div 
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-4 space-y-4"
	>
		{#if messages.length === 0}
			<div class="text-center py-8">
				<div class="text-gray-400 mb-2">💬</div>
				<p class="text-gray-500">Start a conversation with {recipientName}</p>
			</div>
		{:else}
			{#each messages as message, index}
				{#if shouldShowDateHeader(index)}
					<div class="flex justify-center my-4">
						<span class="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
							{formatDate(message.timestamp)}
						</span>
					</div>
				{/if}
				
				<div class="flex {message.senderId === user?.id ? 'justify-end' : 'justify-start'}">
					<div class="max-w-xs lg:max-w-md">
						{#if message.senderId !== user?.id}
							<div class="flex items-end space-x-2">
								<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
									{message.senderName.charAt(0).toUpperCase()}
								</div>
								<div>
									<div class="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
										<p class="text-sm">{message.message}</p>
									</div>
									<p class="text-xs text-gray-500 mt-1 px-1">
										{formatTime(message.timestamp)}
									</p>
								</div>
							</div>
						{:else}
							<div class="flex flex-col items-end">
								<div class="bg-blue-500 text-white rounded-lg px-4 py-2">
									<p class="text-sm">{message.message}</p>
								</div>
								<p class="text-xs text-gray-500 mt-1 px-1">
									{formatTime(message.timestamp)}
									{#if message.isRead}
										<span class="text-blue-500">✓✓</span>
									{:else}
										<span class="text-gray-400">✓</span>
									{/if}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}

		<!-- Typing Indicator -->
		{#if typingUsers.length > 0}
			<div class="flex justify-start">
				<div class="max-w-xs lg:max-w-md">
					<div class="flex items-end space-x-2">
						<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
							{typingUsers[0].charAt(0).toUpperCase()}
						</div>
						<div class="bg-gray-100 rounded-lg px-4 py-2">
							<div class="flex space-x-1">
								<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
								<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
								<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Message Input -->
	<div class="p-4 border-t border-gray-200">
		<div class="flex items-end space-x-2">
			<div class="flex-1">
				<textarea
					bind:value={messageInput}
					on:keydown={handleKeydown}
					on:input={handleTyping}
					placeholder="Type a message..."
					rows="1"
					class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
				></textarea>
			</div>
			<button
				on:click={sendMessage}
				disabled={!messageInput.trim()}
				class="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Send class="w-5 h-5" />
			</button>
		</div>
	</div>
</div>
