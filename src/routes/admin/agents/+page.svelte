<script lang="ts">
	import { onMount } from 'svelte';
	import { Check, X, Eye, Search } from 'lucide-svelte';

	let agents: any[] = [];
	let loading = true;
	let searchQuery = '';
	let statusFilter = 'all';

	onMount(async () => {
		await loadAgents();
	});

	async function loadAgents() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			
			const response = await fetch('/api/admin/agents', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				agents = data.agents || [];
			}
		} catch (error) {
			console.error('Error loading agents:', error);
		} finally {
			loading = false;
		}
	}

	async function updateAgentStatus(agentId: number, status: string) {
		try {
			const token = localStorage.getItem('token');
			
			const response = await fetch(`/api/admin/agents/${agentId}/status`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});
			
			if (response.ok) {
				await loadAgents();
				alert(`Agent ${status} successfully`);
			} else {
				alert('Failed to update agent status');
			}
		} catch (error) {
			console.error('Error updating agent status:', error);
			alert('Error updating agent status');
		}
	}

	$: filteredAgents = agents.filter(agent => {
		const matchesSearch = agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							 agent.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === 'all' || agent.agent_profile?.status === statusFilter;
		return matchesSearch && matchesStatus;
	});
</script>

<svelte:head>
	<title>Agent Management - Houserz Admin</title>
</svelte:head>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Agent Management</h1>
		<p class="mt-2 text-gray-600">Review and manage agent applications</p>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow mb-6">
		<div class="p-6">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder="Search agents..."
							bind:value={searchQuery}
							class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
						>
					</div>
				</div>
				<div>
					<select
						bind:value={statusFilter}
						class="px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
					>
						<option value="all">All Status</option>
						<option value="pending">Pending</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Agents List -->
	<div class="bg-white rounded-lg shadow">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
			</div>
		{:else if filteredAgents.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Agent
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Contact
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								License
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Applied
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredAgents as agent}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
											<span class="text-sm font-medium text-gray-700">
												{agent.full_name.charAt(0)}
											</span>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{agent.full_name}</div>
											<div class="text-sm text-gray-500">Agent ID: {agent.id}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">{agent.email}</div>
									<div class="text-sm text-gray-500">{agent.agent_profile?.phone || 'N/A'}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">{agent.agent_profile?.license_number || 'N/A'}</div>
									<div class="text-sm text-gray-500">{agent.agent_profile?.company || 'Independent'}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
										agent.agent_profile?.status === 'approved' ? 'bg-green-100 text-green-800' :
										agent.agent_profile?.status === 'rejected' ? 'bg-red-100 text-red-800' :
										'bg-yellow-100 text-yellow-800'
									}">
										{agent.agent_profile?.status || 'pending'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{new Date(agent.created_at).toLocaleDateString()}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div class="flex space-x-2">
										{#if agent.agent_profile?.status === 'pending'}
											<button 
												on:click={() => updateAgentStatus(agent.id, 'approved')}
												class="text-green-600 hover:text-green-900"
												title="Approve"
											>
												<Check class="w-4 h-4" />
											</button>
											<button 
												on:click={() => updateAgentStatus(agent.id, 'rejected')}
												class="text-red-600 hover:text-red-900"
												title="Reject"
											>
												<X class="w-4 h-4" />
											</button>
										{/if}
										<button class="text-blue-600 hover:text-blue-900" title="View Details">
											<Eye class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="text-center py-12">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
					<Check class="w-8 h-8 text-gray-400" />
				</div>
				<h3 class="mt-4 text-lg font-medium text-gray-900">No agents found</h3>
				<p class="mt-2 text-gray-500">
					{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No agent applications yet'}
				</p>
			</div>
		{/if}
	</div>
</div>
