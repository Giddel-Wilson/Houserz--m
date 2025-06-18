<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Users, 
		Search, 
		Filter, 
		Eye, 
		Edit3, 
		Trash2, 
		UserPlus, 
		Shield, 
		ShieldAlert, 
		ShieldCheck,
		Mail,
		Phone,
		Calendar,
		MoreVertical,
		AlertTriangle,
		CheckCircle,
		XCircle,
		Clock,
		Ban,
		UserX
	} from 'lucide-svelte';

	let user: any = null;
	let users: any[] = [];
	let filteredUsers: any[] = [];
	let searchQuery = '';
	let roleFilter = 'all';
	let statusFilter = 'all';
	let loading = true;
	let error = '';
	let success = '';
	let showPenaltyModal = false;
	let selectedUser: any = null;
	let penaltyReason = '';
	let penaltyType: 'WARNING' | 'SUSPENSION' | 'BAN' = 'WARNING';
	let penaltyDuration = 7; // days

	const roleOptions = [
		{ value: 'all', label: 'All Roles' },
		{ value: 'ADMIN', label: 'Administrators' },
		{ value: 'AGENT', label: 'Agents' },
		{ value: 'CLIENT', label: 'Clients' }
	];

	const statusOptions = [
		{ value: 'all', label: 'All Status' },
		{ value: 'active', label: 'Active' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'banned', label: 'Banned' }
	];

	const penaltyTypes = [
		{ value: 'WARNING', label: 'Warning', description: 'Send a warning message' },
		{ value: 'SUSPENSION', label: 'Suspension', description: 'Temporarily suspend account' },
		{ value: 'BAN', label: 'Ban', description: 'Permanently ban account' }
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
	});

	async function loadUsers() {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/manage-users', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				users = data.users || [];
				filterUsers();
			} else {
				error = 'Failed to load users';
			}
		} catch (err) {
			error = 'Failed to load users';
			console.error('Error loading users:', err);
		} finally {
			loading = false;
		}
	}

	function filterUsers() {
		filteredUsers = users.filter(u => {
			const matchesSearch = !searchQuery || 
				u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesRole = roleFilter === 'all' || u.role === roleFilter;
			
			const matchesStatus = statusFilter === 'all' || 
				(statusFilter === 'active' && !u.isSuspended && !u.isBanned) ||
				(statusFilter === 'suspended' && u.isSuspended) ||
				(statusFilter === 'banned' && u.isBanned);
			
			return matchesSearch && matchesRole && matchesStatus;
		});
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'ADMIN': return 'red';
			case 'AGENT': return 'blue';
			case 'CLIENT': return 'green';
			default: return 'gray';
		}
	}

	function getStatusIcon(userObj: any) {
		if (userObj.isBanned) return { icon: XCircle, color: 'text-red-500', label: 'Banned' };
		if (userObj.isSuspended) return { icon: Clock, color: 'text-yellow-500', label: 'Suspended' };
		if (userObj.isOnline) return { icon: CheckCircle, color: 'text-green-500', label: 'Online' };
		return { icon: Clock, color: 'text-gray-400', label: 'Offline' };
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openPenaltyModal(userObj: any) {
		selectedUser = userObj;
		showPenaltyModal = true;
		penaltyReason = '';
		penaltyType = 'WARNING';
		penaltyDuration = 7;
	}

	function closePenaltyModal() {
		showPenaltyModal = false;
		selectedUser = null;
		penaltyReason = '';
	}

	async function applyPenalty() {
		if (!selectedUser || !penaltyReason.trim()) {
			error = 'Please provide a reason for the penalty';
			return;
		}

		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/users', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					userId: selectedUser.id,
					action: penaltyType === 'WARNING' ? 'warn' : penaltyType === 'SUSPENSION' ? 'suspend' : 'ban',
					reason: penaltyReason,
					duration: penaltyType === 'SUSPENSION' ? penaltyDuration : null
				})
			});

			if (response.ok) {
				success = `${penaltyType.toLowerCase()} applied successfully`;
				closePenaltyModal();
				loadUsers();
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to apply penalty';
			}
		} catch (err) {
			error = 'Failed to apply penalty';
			console.error('Error applying penalty:', err);
		}
	}

	async function removeRestriction(userId: number) {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/users', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ 
					userId: userId,
					action: 'unsuspend'
				})
			});

			if (response.ok) {
				success = 'Restriction removed successfully';
				loadUsers();
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to remove restriction';
			}
		} catch (err) {
			error = 'Failed to remove restriction';
			console.error('Error removing restriction:', err);
		}
	}

	$: {
		filterUsers();
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 flex items-center">
				<Users class="h-8 w-8 mr-3 text-blue-600" />
				User Management
			</h1>
			<p class="mt-2 text-gray-600">Manage user accounts, roles, and penalties</p>
		</div>

		<!-- Alert Messages -->
		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
				<AlertTriangle class="h-5 w-5 mr-2" />
				{error}
				<button on:click={() => error = ''} class="ml-auto">
					<XCircle class="h-5 w-5" />
				</button>
			</div>
		{/if}

		{#if success}
			<div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
				<CheckCircle class="h-5 w-5 mr-2" />
				{success}
				<button on:click={() => success = ''} class="ml-auto">
					<XCircle class="h-5 w-5" />
				</button>
			</div>
		{/if}

		<!-- Filters and Search -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<!-- Search -->
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search users..."
						bind:value={searchQuery}
						class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Role Filter -->
				<select
					bind:value={roleFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					{#each roleOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>

				<!-- Status Filter -->
				<select
					bind:value={statusFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					{#each statusOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>

				<!-- Results Count -->
				<div class="flex items-center text-sm text-gray-500">
					Showing {filteredUsers.length} of {users.length} users
				</div>
			</div>
		</div>

		<!-- Users Table -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
			{#if loading}
				<div class="p-8 text-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p class="mt-2 text-gray-500">Loading users...</p>
				</div>
			{:else if filteredUsers.length > 0}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each filteredUsers as userObj}
								{@const status = getStatusIcon(userObj)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div class="flex-shrink-0 h-10 w-10">
												{#if userObj.avatar}
													<img class="h-10 w-10 rounded-full object-cover" src={userObj.avatar} alt={userObj.fullName} />
												{:else}
													<div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
														<span class="text-sm font-medium text-gray-700">
															{userObj.fullName.charAt(0).toUpperCase()}
														</span>
													</div>
												{/if}
											</div>
											<div class="ml-4">
												<div class="text-sm font-medium text-gray-900">{userObj.fullName}</div>
												<div class="text-sm text-gray-500 flex items-center">
													<Mail class="h-3 w-3 mr-1" />
													{userObj.email}
												</div>
												{#if userObj.phone}
													<div class="text-sm text-gray-500 flex items-center">
														<Phone class="h-3 w-3 mr-1" />
														{userObj.phone}
													</div>
												{/if}
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-{getRoleColor(userObj.role)}-100 text-{getRoleColor(userObj.role)}-800">
											{#if userObj.role === 'ADMIN'}
												<Shield class="h-3 w-3 mr-1" />
											{/if}
											{userObj.role}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<svelte:component this={status.icon} class="h-4 w-4 mr-2 {status.color}" />
											<span class="text-sm text-gray-900">{status.label}</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(userObj.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{userObj.lastSeen ? formatDate(userObj.lastSeen) : 'Never'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div class="flex items-center space-x-2">
											<!-- View Profile -->
											<button
												class="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
												title="View Profile"
											>
												<Eye class="h-4 w-4" />
											</button>

											<!-- Apply Penalty (only for non-admins) -->
											{#if userObj.role !== 'ADMIN' && userObj.id !== user.id}
												<button
													on:click={() => openPenaltyModal(userObj)}
													class="text-yellow-600 hover:text-yellow-900 p-1 rounded-md hover:bg-yellow-50"
													title="Apply Penalty"
												>
													<ShieldAlert class="h-4 w-4" />
												</button>
											{/if}

											<!-- Remove Restriction -->
											{#if (userObj.isSuspended || userObj.isBanned) && userObj.id !== user.id}
												<button
													on:click={() => removeRestriction(userObj.id)}
													class="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
													title="Remove Restriction"
												>
													<ShieldCheck class="h-4 w-4" />
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="text-center py-12">
					<Users class="h-12 w-12 text-gray-300 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
					<p class="text-gray-500">Try adjusting your search or filter criteria</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Penalty Modal -->
{#if showPenaltyModal && selectedUser}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
			<div class="p-6 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900 flex items-center">
					<ShieldAlert class="h-5 w-5 mr-2 text-yellow-500" />
					Apply Penalty to {selectedUser.fullName}
				</h3>
			</div>

			<div class="p-6 space-y-4">
				<!-- Penalty Type -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Penalty Type</label>
					<div class="space-y-2">
						{#each penaltyTypes as type}
							<label class="flex items-start">
								<input
									type="radio"
									bind:group={penaltyType}
									value={type.value}
									class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
								/>
								<div class="ml-3">
									<div class="text-sm font-medium text-gray-900">{type.label}</div>
									<div class="text-sm text-gray-500">{type.description}</div>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<!-- Duration (for suspension) -->
				{#if penaltyType === 'SUSPENSION'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
						<input
							type="number"
							bind:value={penaltyDuration}
							min="1"
							max="365"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				{/if}

				<!-- Reason -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
					<textarea
						bind:value={penaltyReason}
						rows="3"
						placeholder="Explain the reason for this penalty..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					></textarea>
				</div>
			</div>

			<div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
				<button
					on:click={closePenaltyModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
				>
					Cancel
				</button>
				<button
					on:click={applyPenalty}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
				>
					Apply Penalty
				</button>
			</div>
		</div>
	</div>
{/if}
