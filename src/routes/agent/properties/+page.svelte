<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Edit, Eye, Trash2, Search } from 'lucide-svelte';
	import { showDeleteConfirmation } from '$lib/stores/confirmations';
	import { showSuccess, showError } from '$lib/stores/notifications';

	let properties: any[] = [];
	let loading = true;
	let searchQuery = '';
	let statusFilter = 'all';

	onMount(async () => {
		await loadProperties();
	});

	async function loadProperties() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			
			if (!token) {
				showError('Authentication required. Please log in again.');
				return;
			}
			
			const response = await fetch('/api/agent/properties', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				properties = data.properties || [];
				console.log('Loaded properties:', properties);
			} else {
				const errorData = await response.json();
				showError(errorData.error || 'Failed to load properties');
			}
		} catch (error) {
			console.error('Error loading properties:', error);
			showError('Failed to load properties');
		} finally {
			loading = false;
		}
	}

	async function deleteProperty(propertyId: number) {
		const property = properties.find(p => p.id === propertyId);
		const propertyName = property ? property.title : `Property #${propertyId}`;
		
		showDeleteConfirmation(propertyName, async () => {
			try {
				const token = localStorage.getItem('token');
				
				const response = await fetch(`/api/agent/properties/${propertyId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				
				if (response.ok) {
					properties = properties.filter(p => p.id !== propertyId);
					showSuccess('Property deleted successfully');
				} else {
					const errorData = await response.json();
					showError(errorData.error || 'Failed to delete property');
				}
			} catch (error) {
				console.error('Error deleting property:', error);
				showError('Error deleting property');
			}
		});
	}

	async function updatePropertyStatus(propertyId: number, status: string) {
		try {
			const token = localStorage.getItem('token');
			
			const response = await fetch(`/api/agent/properties/${propertyId}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});
			
			if (response.ok) {
				const property = properties.find(p => p.id === propertyId);
				if (property) {
					property.status = status;
					properties = properties;
					showSuccess('Property status updated successfully');
				}
			} else {
				const errorData = await response.json();
				showError(errorData.error || 'Failed to update property status');
			}
		} catch (error) {
			console.error('Error updating property status:', error);
			showError('Error updating property status');
		}
	}

	$: filteredProperties = properties.filter(property => {
		const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
							 property.city.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === 'all' || property.status.toLowerCase() === statusFilter;
		return matchesSearch && matchesStatus;
	});
</script>

<svelte:head>
	<title>My Properties - Houserz Agent</title>
</svelte:head>

<div class="flex flex-col h-full max-w-7xl mx-auto p-4 lg:p-6 py-5 lg:py-4 w-screen lg:w-full">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
		<div>
			<h1 class="text-2xl lg:text-3xl font-bold text-gray-900 ml-12 lg:ml-0">My Properties</h1>
			<p class="mt-2 text-gray-600">Manage your property listings</p>
		</div>
		<a 
			href="/agent/add-property"
			class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-auto"
		>
			<Plus class="w-4 h-4 mr-2" />
			Add Property
		</a>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow mb-6">
		<div class="p-4 lg:p-6">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder="Search properties..."
							bind:value={searchQuery}
							class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
						>
					</div>
				</div>
				<div class="w-full sm:w-auto">
					<select
						bind:value={statusFilter}
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="pending">Pending</option>
						<option value="sold">Sold</option>
						<option value="rented">Rented</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Properties List -->
	<div class="bg-white rounded-lg shadow flex-1 flex flex-col min-h-0">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
			</div>
		{:else if filteredProperties.length > 0}
			<div class="flex-1 overflow-hidden">
				<div class="overflow-x-auto h-full">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50 sticky top-0">
							<tr>
								<th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Property
								</th>
								<th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
									Type
								</th>
								<th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Price
								</th>
								<th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
									Status
								</th>
								<th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
									Views
								</th>
								<th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each filteredProperties as property}
								<tr>
									<td class="px-4 lg:px-6 py-4">
										<div class="flex items-center">
											<img 
												src={property.images?.[0]?.imageUrl || '/house-1.jpg'} 
												alt={property.title}
												class="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-cover flex-shrink-0"
											>
											<div class="ml-3 lg:ml-4 min-w-0">
												<div class="text-sm font-medium text-gray-900 truncate">{property.title}</div>
												<div class="text-sm text-gray-500 truncate">{property.city}, {property.state}</div>
											</div>
										</div>
									</td>
									<td class="px-4 lg:px-6 py-4 hidden sm:table-cell">
										<div class="text-sm text-gray-900 capitalize">{property.propertyType}</div>
										<div class="text-sm text-gray-500 capitalize">{property.listingType}</div>
									</td>
									<td class="px-4 lg:px-6 py-4">
										<div class="text-sm font-medium text-gray-900">₦{property.price.toLocaleString()}</div>
									</td>
									<td class="px-4 lg:px-6 py-4 hidden md:table-cell">
										<select
											value={property.status}
											on:change={(e) => updatePropertyStatus(property.id, e.target.value)}
											class="text-sm border-0 bg-transparent font-medium rounded-full px-2 py-1 {
												property.status === 'active' ? 'text-green-800 bg-green-100' :
												property.status === 'pending' ? 'text-yellow-800 bg-yellow-100' :
												property.status === 'sold' || property.status === 'rented' ? 'text-red-800 bg-red-100' :
												'text-gray-800 bg-gray-100'
											}"
										>
											<option value="active">Active</option>
											<option value="pending">Pending</option>
											<option value="sold">Sold</option>
											<option value="rented">Rented</option>
										</select>
									</td>
									<td class="px-4 lg:px-6 py-4 text-sm text-gray-900 hidden lg:table-cell">
										{property.viewsCount || 0}
									</td>
									<td class="px-4 lg:px-6 py-4 text-sm font-medium">
										<div class="flex space-x-2">
											<a 
												href="/agent/properties/{property.id}"
												class="text-green-600 hover:text-green-900"
												title="View Details"
											>
												<Eye class="w-4 h-4" />
											</a>
											<a 
												href="/agent/properties/{property.id}?edit=true"
												class="text-green-600 hover:text-green-900"
												title="Edit Property"
											>
												<Edit class="w-4 h-4" />
											</a>
											<button 
												on:click={() => deleteProperty(property.id)}
												class="text-red-600 hover:text-red-900"
												title="Delete Property"
											>
												<Trash2 class="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="text-center py-12">
				<img src="/house-1.jpg" alt="No properties" class="mx-auto h-24 w-24 lg:h-32 lg:w-32 object-cover rounded-lg opacity-50">
				<h3 class="mt-4 text-lg font-medium text-gray-900">No properties found</h3>
				<p class="mt-2 text-gray-500">
					{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first property'}
				</p>
				{#if !searchQuery && statusFilter === 'all'}
					<div class="mt-6">
						<a 
							href="/agent/add-property"
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
						>
							<Plus class="w-4 h-4 mr-2" />
							Add Property
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
