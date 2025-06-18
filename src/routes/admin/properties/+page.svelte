<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Building2, 
		Search, 
		Filter, 
		Eye, 
		Edit3, 
		Trash2, 
		MapPin, 
		DollarSign,
		AlertTriangle,
		CheckCircle,
		XCircle,
		MoreVertical,
		User
	} from 'lucide-svelte';

	let user: any = null;
	let properties: any[] = [];
	let filteredProperties: any[] = [];
	let searchTerm = '';
	let statusFilter = 'all';
	let typeFilter = 'all';
	let loading = true;
	let showDeleteModal = false;
	let propertyToDelete: any = null;

	onMount(() => {
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (!userData || !token) {
			goto('/login');
			return;
		}
		
		user = JSON.parse(userData);
		
		// The layout already handles admin role checking, so just load data
		loadProperties();
	});

	async function loadProperties() {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				console.error('No token found');
				goto('/login');
				return;
			}
			
			const response = await fetch('/api/admin/properties', {
				headers: {
					'Authorization': 'Bearer ' + token
				}
			});

			if (response.ok) {
				const data = await response.json();
				properties = data.properties || [];
				applyFilters();
			} else {
				console.error('Failed to load properties:', response.status);
			}
		} catch (error) {
			console.error('Error loading properties:', error);
		} finally {
			loading = false;
		}
	}

	async function togglePropertyStatus(propertyId: number, currentStatus: string) {
		try {
			const token = localStorage.getItem('token');
			const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
			
			const response = await fetch('/api/admin/properties/' + propertyId + '/status', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + token
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				properties = properties.map(prop => 
					prop.id === propertyId 
						? { ...prop, status: newStatus }
						: prop
				);
				applyFilters();
			}
		} catch (error) {
			console.error('Error updating property status:', error);
		}
	}

	async function deleteProperty(propertyId: number) {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/properties/' + propertyId, {
				method: 'DELETE',
				headers: {
					'Authorization': 'Bearer ' + token
				}
			});

			if (response.ok) {
				properties = properties.filter(prop => prop.id !== propertyId);
				applyFilters();
				showDeleteModal = false;
				propertyToDelete = null;
			}
		} catch (error) {
			console.error('Error deleting property:', error);
		}
	}

	function applyFilters() {
		filteredProperties = properties.filter(property => {
			const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
				property.agent?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
			
			const matchesStatus = statusFilter === 'all' || property.status === statusFilter.toUpperCase();
			const matchesType = typeFilter === 'all' || property.type === typeFilter.toUpperCase();
			
			return matchesSearch && matchesStatus && matchesType;
		});
	}

	function formatPrice(price: number) {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN'
		}).format(price);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'ACTIVE': return 'text-green-600 bg-green-100';
			case 'INACTIVE': return 'text-red-600 bg-red-100';
			case 'PENDING': return 'text-yellow-600 bg-yellow-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	$: searchTerm, statusFilter, typeFilter, applyFilters();
</script>

<svelte:head>
	<title>Properties Management - Admin - Houserz</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Properties Management</h1>
				<p class="text-gray-600 mt-1">Monitor and manage all property listings on the platform</p>
			</div>
			<div class="flex items-center space-x-3">
				<div class="text-right">
					<p class="text-2xl font-bold text-blue-600">{properties.length}</p>
					<p class="text-sm text-gray-600">Total Properties</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				<input
					type="text"
					placeholder="Search properties..."
					bind:value={searchTerm}
					class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
				/>
			</div>
			
			<select
				bind:value={statusFilter}
				class="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
			>
				<option value="all">All Status</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
				<option value="pending">Pending</option>
			</select>
			
			<select
				bind:value={typeFilter}
				class="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
			>
				<option value="all">All Types</option>
				<option value="sale">For Sale</option>
				<option value="rent">For Rent</option>
			</select>
			
			<button class="flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
				<Filter class="h-4 w-4 mr-2" />
				Apply Filters
			</button>
		</div>
	</div>

	<!-- Properties List -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">
				Properties ({filteredProperties.length})
			</h2>
		</div>
		
		<div class="p-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
					<span class="ml-3 text-gray-600">Loading properties...</span>
				</div>
			{:else if filteredProperties.length === 0}
				<div class="text-center py-12">
					<Building2 class="h-16 w-16 text-gray-300 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
					<p class="text-gray-600">No properties match your current filters.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each filteredProperties as property}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between">
								<div class="flex space-x-4 flex-1">
									<div class="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
										{#if property.images && property.images.length > 0}
											<img 
												src={property.images[0]} 
												alt={property.title}
												class="w-full h-full object-cover rounded-lg"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<Building2 class="h-8 w-8 text-gray-400" />
											</div>
										{/if}
									</div>
									
									<div class="flex-1">
										<div class="flex items-start justify-between">
											<div>
												<h3 class="text-lg font-semibold text-gray-900">{property.title}</h3>
												<div class="flex items-center text-gray-600 mt-1">
													<MapPin class="h-4 w-4 mr-1" />
													<span class="text-sm">{property.location}</span>
												</div>
												<div class="flex items-center text-gray-600 mt-1">
													<User class="h-4 w-4 mr-1" />
													<span class="text-sm">Agent: {property.agent?.fullName || 'Unknown'}</span>
												</div>
											</div>
											
											<div class="text-right">
												<div class="flex items-center text-green-600 font-semibold">
													<DollarSign class="h-4 w-4 mr-1" />
													{formatPrice(property.price)}
												</div>
												<span class="text-xs text-gray-500 capitalize">{property.type}</span>
											</div>
										</div>
										
										<div class="flex items-center justify-between mt-3">
											<div class="flex items-center space-x-3">
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(property.status)}">
													{property.status}
												</span>
											</div>
											
											<div class="flex items-center space-x-2">
												<a 
													href="/admin/properties/{property.id}"
													class="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
													title="View Property"
												>
													<Eye class="h-4 w-4" />
												</a>
												
												<button
													on:click={() => togglePropertyStatus(property.id, property.status)}
													class="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
													title={property.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
												>
													{#if property.status === 'ACTIVE'}
														<XCircle class="h-4 w-4" />
													{:else}
														<CheckCircle class="h-4 w-4" />
													{/if}
												</button>
												
												<button
													on:click={() => { propertyToDelete = property; showDeleteModal = true; }}
													class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
													title="Delete Property"
												>
													<Trash2 class="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && propertyToDelete}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
			<div class="flex items-center mb-4">
				<AlertTriangle class="h-6 w-6 text-red-600 mr-3" />
				<h3 class="text-lg font-semibold text-gray-900">Delete Property</h3>
			</div>
			
			<p class="text-gray-600 mb-6">
				Are you sure you want to delete "{propertyToDelete.title}"? This action cannot be undone.
			</p>
			
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => { showDeleteModal = false; propertyToDelete = null; }}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
				>
					Cancel
				</button>
				<button
					on:click={() => deleteProperty(propertyToDelete.id)}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
