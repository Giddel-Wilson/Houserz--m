<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Send, 
		Users, 
		MessageSquare, 
		Search, 
		Filter,
		Check,
		Clock,
		AlertCircle,
		X,
		User,
		Building2
	} from 'lucide-svelte';

	let user: any = null;
	let users: any[] = [];
	let selectedUsers: number[] = [];
	let messageContent = '';
	let messageSubject = '';
	let messageType: 'NOTIFICATION' | 'ANNOUNCEMENT' | 'WARNING' = 'NOTIFICATION';
	let searchQuery = '';
	let roleFilter = 'all';
	let loading = true;
	let sending = false;
	let sentMessages: any[] = [];
	let showSentMessages = false;
	let error = '';
	let success = '';

	const roleOptions = [
		{ value: 'all', label: 'All Users' },
		{ value: 'CLIENT', label: 'Clients (Buyers/Renters)' },
		{ value: 'AGENT', label: 'Agents' }
	];

	const messageTypeOptions = [
		{ value: 'NOTIFICATION', label: 'Notification', color: 'blue' },
		{ value: 'ANNOUNCEMENT', label: 'Announcement', color: 'green' },
		{ value: 'WARNING', label: 'Warning', color: 'red' }
	];

	onMount(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			goto('/login');
			return;
		}
		
		user = JSON.parse(userData);
		
		// The layout already handles admin role checking, so just load data
		loadUsers();
		loadSentMessages();
	});

	async function loadUsers() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/admin', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				users = data.users || [];
			} else {
				error = 'Failed to load users';
			}
		} catch (err) {
			error = 'Error loading users';
			console.error('Error loading users:', err);
		} finally {
			loading = false;
		}
	}

	async function loadSentMessages() {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/messages/sent', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				sentMessages = data.messages || [];
			}
		} catch (err) {
			console.error('Error loading sent messages:', err);
		}
	}

	async function sendMessage() {
		if (!messageContent.trim()) {
			error = 'Message content is required';
			return;
		}
		
		if (selectedUsers.length === 0) {
			error = 'Please select at least one recipient';
			return;
		}
		
		try {
			sending = true;
			error = '';
			success = '';
			
			const token = localStorage.getItem('token');
			const response = await fetch('/api/messages/admin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					recipientIds: selectedUsers,
					content: messageContent,
					subject: messageSubject,
					messageType,
					isSystemMessage: true
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				success = data.message;
				
				// Clear form
				messageContent = '';
				messageSubject = '';
				selectedUsers = [];
				messageType = 'NOTIFICATION';
				
				// Reload sent messages
				await loadSentMessages();
				
				setTimeout(() => success = '', 5000);
			} else {
				const data = await response.json();
				error = data.error || 'Failed to send message';
			}
		} catch (err) {
			error = 'Error sending message';
		} finally {
			sending = false;
		}
	}

	function toggleUserSelection(userId: number) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter(id => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}

	function selectAllUsers() {
		selectedUsers = filteredUsers.map(u => u.id);
	}

	function clearSelection() {
		selectedUsers = [];
	}

	function selectByRole(role: string) {
		if (role === 'all') {
			selectAllUsers();
		} else {
			selectedUsers = filteredUsers
				.filter(u => u.role === role)
				.map(u => u.id);
		}
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getTypeColor(type: string) {
		const typeOption = messageTypeOptions.find(opt => opt.value === type);
		return typeOption?.color || 'gray';
	}

	$: filteredUsers = users.filter(user => {
		const matchesSearch = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
							 user.email?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = roleFilter === 'all' || user.role === roleFilter;
		return matchesSearch && matchesRole;
	});
</script>

<svelte:head>
	<title>System Messages - Houserz Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">System Messages</h1>
			<p class="mt-2 text-gray-600">Send notifications and announcements to users and agents</p>
		</div>

		<!-- Success/Error Messages -->
		{#if success}
			<div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
				<p class="text-green-700">{success}</p>
			</div>
		{/if}

		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
				<p class="text-red-700">{error}</p>
			</div>
		{/if}

		<!-- Toggle View -->
		<div class="mb-6">
			<div class="flex space-x-4">
				<button
					on:click={() => showSentMessages = false}
					class="px-4 py-2 rounded-lg font-medium {!showSentMessages ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}"
				>
					<MessageSquare class="h-4 w-4 inline mr-2" />
					Compose Message
				</button>
				<button
					on:click={() => showSentMessages = true}
					class="px-4 py-2 rounded-lg font-medium {showSentMessages ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}"
				>
					<Clock class="h-4 w-4 inline mr-2" />
					Sent Messages ({sentMessages.length})
				</button>
			</div>
		</div>

		{#if !showSentMessages}
			<!-- Compose Message -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Recipients Selection -->
				<div class="bg-white rounded-lg shadow">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900 flex items-center">
							<Users class="h-5 w-5 mr-2" />
							Select Recipients ({selectedUsers.length} selected)
						</h2>
					</div>
					<div class="p-6">
						<!-- Search and Filters -->
						<div class="mb-4 space-y-4">
							<div class="relative">
								<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search users..."
									bind:value={searchQuery}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div class="flex flex-wrap gap-2">
								<select
									bind:value={roleFilter}
									class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{#each roleOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>
							<div class="flex flex-wrap gap-2">
								<button
									on:click={selectAllUsers}
									class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
								>
									Select All
								</button>
								<button
									on:click={() => selectByRole('CLIENT')}
									class="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200"
								>
									All Clients
								</button>
								<button
									on:click={() => selectByRole('AGENT')}
									class="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200"
								>
									All Agents
								</button>
								<button
									on:click={clearSelection}
									class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
								>
									Clear All
								</button>
							</div>
						</div>

						<!-- Users List -->
						<div class="max-h-96 overflow-y-auto space-y-2">
							{#if loading}
								<div class="flex items-center justify-center py-8">
									<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
									<span class="ml-2 text-gray-600">Loading users...</span>
								</div>
							{:else if filteredUsers.length > 0}
								{#each filteredUsers as targetUser}
									<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
										<div class="flex items-center">
											<input
												type="checkbox"
												checked={selectedUsers.includes(targetUser.id)}
												on:change={() => toggleUserSelection(targetUser.id)}
												class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<div class="ml-3">
												<div class="flex items-center">
													{#if targetUser.role === 'AGENT'}
														<Building2 class="h-4 w-4 text-purple-500 mr-1" />
													{:else}
														<User class="h-4 w-4 text-green-500 mr-1" />
													{/if}
													<p class="text-sm font-medium text-gray-900">{targetUser.fullName || 'Unknown User'}</p>
												</div>
												<p class="text-xs text-gray-500">{targetUser.email}</p>
											</div>
										</div>
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
											targetUser.role === 'AGENT' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
										}">
											{targetUser.role === 'AGENT' ? 'Agent' : 'Client'}
										</span>
									</div>
								{/each}
							{:else}
								<div class="text-center py-8">
									<Users class="h-12 w-12 text-gray-300 mx-auto mb-2" />
									<p class="text-gray-500">No users found</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Message Composition -->
				<div class="bg-white rounded-lg shadow">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900 flex items-center">
							<MessageSquare class="h-5 w-5 mr-2" />
							Compose Message
						</h2>
					</div>
					<div class="p-6 space-y-4">
						<!-- Message Type -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
							<div class="grid grid-cols-3 gap-2">
								{#each messageTypeOptions as option}
									<button
										type="button"
										on:click={() => messageType = option.value}
										class="flex items-center justify-center px-3 py-2 border rounded-lg text-sm font-medium {
											messageType === option.value 
												? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
												: 'border-gray-300 text-gray-700 hover:bg-gray-50'
										}"
									>
										{#if option.value === 'NOTIFICATION'}
											<AlertCircle class="h-4 w-4 mr-1" />
										{:else if option.value === 'ANNOUNCEMENT'}
											<MessageSquare class="h-4 w-4 mr-1" />
										{:else}
											<AlertCircle class="h-4 w-4 mr-1" />
										{/if}
										{option.label}
									</button>
								{/each}
							</div>
						</div>

						<!-- Subject -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
							<input
								type="text"
								bind:value={messageSubject}
								placeholder="Enter message subject..."
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<!-- Message Content -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
							<textarea
								bind:value={messageContent}
								placeholder="Enter your message here..."
								rows="8"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
							></textarea>
						</div>

						<!-- Send Button -->
						<div class="flex justify-end">
							<button
								type="button"
								on:click={sendMessage}
								disabled={sending || !messageContent.trim() || selectedUsers.length === 0}
								class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{#if sending}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								{:else}
									<Send class="h-4 w-4 mr-2" />
								{/if}
								Send Message
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Sent Messages -->
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900 flex items-center">
						<Clock class="h-5 w-5 mr-2" />
						Sent Messages
					</h2>
				</div>
				<div class="overflow-x-auto">
					{#if sentMessages.length > 0}
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each sentMessages as message}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4">
											<div>
												{#if message.subject}
													<p class="text-sm font-medium text-gray-900">{message.subject}</p>
												{/if}
												<p class="text-sm text-gray-600 line-clamp-2">{message.content}</p>
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-{getTypeColor(message.messageType)}-100 text-{getTypeColor(message.messageType)}-800">
												{message.messageType}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{message.recipientCount || 0} users
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatDate(message.createdAt)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
												<Check class="h-3 w-3 mr-1" />
												Delivered
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<div class="text-center py-12">
							<MessageSquare class="h-12 w-12 text-gray-300 mx-auto mb-4" />
							<h3 class="text-lg font-medium text-gray-900 mb-2">No messages sent yet</h3>
							<p class="text-gray-500">Messages you send will appear here</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
