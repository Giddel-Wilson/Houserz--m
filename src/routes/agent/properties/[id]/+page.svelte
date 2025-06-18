<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Edit, Trash2, Camera, MapPin, Home, Calendar } from 'lucide-svelte';
	import { showDeleteConfirmation } from '$lib/stores/confirmations';
	import { showSuccess, showError } from '$lib/stores/notifications';

	interface Property {
		id: number;
		title: string;
		description: string;
		propertyType: string;
		listingType: string;
		price: number;
		bedrooms: number | null;
		bathrooms: number | null;
		sqft: number | null;
		city: string;
		state: string;
		address: string;
		status: string;
		features: string;
		viewsCount: number;
		createdAt: string;
		updatedAt: string;
		images: Array<{
			id: number;
			imageUrl: string;
			isPrimary: boolean;
			displayOrder: number;
		}>;
		agent: {
			id: number;
			fullName: string;
			email: string;
			phone: string | null;
		};
	}

	let property: Property | null = null;
	let loading = true;
	let error = '';
	let currentImageIndex = 0;
	let showEditMode = false;
	let editForm: any = {};

	$: propertyId = $page.params.id;
	$: if ($page.url.searchParams.get('edit') === 'true') {
		showEditMode = true;
	}

	onMount(() => {
		loadProperty();
	});

	async function loadProperty() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			
			const response = await fetch(`/api/agent/properties/${propertyId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				property = data.property;
				
				// Debug logging
				console.log('Property loaded:', property);
				console.log('Images:', property?.images);
				console.log('Images length:', property?.images?.length);
				if (property?.images?.length > 0) {
					console.log('First image:', property.images[0]);
				}
				
				// Initialize edit form with current property data
				if (property) {
					editForm = {
						title: property.title,
						description: property.description,
						price: property.price,
						bedrooms: property.bedrooms,
						bathrooms: property.bathrooms,
						sqft: property.sqft,
						city: property.city,
						state: property.state,
						address: property.address,
						status: property.status
					};
				}
			} else {
				error = 'Failed to load property';
			}
		} catch (err) {
			error = 'Failed to load property details';
			console.error('Error loading property:', err);
		} finally {
			loading = false;
		}
	}

	async function deleteProperty() {
		if (!property) return;
		
		showDeleteConfirmation(property.title, async () => {
			try {
				const token = localStorage.getItem('token');
				
				const response = await fetch(`/api/agent/properties/${propertyId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				
				if (response.ok) {
					showSuccess('Property deleted successfully');
					goto('/agent/properties');
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

	async function updateProperty() {
		try {
			const token = localStorage.getItem('token');
			
			const response = await fetch(`/api/agent/properties/${propertyId}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});
			
			if (response.ok) {
				const data = await response.json();
				property = data.property;
				showEditMode = false;
				alert('Property updated successfully');
			} else {
				alert('Failed to update property');
			}
		} catch (error) {
			console.error('Error updating property:', error);
			alert('Error updating property');
		}
	}

	function nextImage() {
		if (property && property.images.length > 0) {
			currentImageIndex = (currentImageIndex + 1) % property.images.length;
		}
	}

	function prevImage() {
		if (property && property.images.length > 0) {
			currentImageIndex = currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1;
		}
	}

	function parseFeatures(featuresString: string): string[] {
		try {
			return JSON.parse(featuresString);
		} catch {
			return [];
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{property ? property.title : 'Property Details'} - Houserz Agent</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto p-4 lg:p-6">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<button 
				on:click={() => goto('/agent/properties')}
				class="inline-flex items-center text-gray-600 hover:text-gray-900 ml-12"
			>
				<ArrowLeft class="w-5 h-5 mr-2" />
				Back to Properties
			</button>
			
			{#if property}
				<div class="flex space-x-3">
					<button 
						on:click={deleteProperty}
						class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
					>
						<Trash2 class="w-4 h-4 mr-2" />
						Delete
					</button>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<h3 class="text-lg font-medium text-gray-900">Error Loading Property</h3>
				<p class="mt-2 text-gray-500">{error}</p>
			</div>
		{:else if property}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Images Section -->
				<div class="lg:col-span-2">
					<div class="bg-white rounded-lg shadow overflow-hidden">
						{#if property.images && property.images.length > 0}
							<div class="relative">
								<img 
									src={property.images[currentImageIndex].imageUrl} 
									alt={property.title}
									class="w-full h-64 lg:h-96 object-cover"
									on:error={(e) => {
										console.error('Image failed to load:', property.images[currentImageIndex].imageUrl);
										e.target.src = '/placeholder-property.jpg';
									}}
									on:load={() => {
										console.log('Image loaded successfully:', property.images[currentImageIndex].imageUrl);
									}}
								/>
								
								{#if property.images.length > 1}
									<button 
										on:click={prevImage}
										class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
									>
										‹
									</button>
									<button 
										on:click={nextImage}
										class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
									>
										›
									</button>
									
									<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
										<div class="flex space-x-2">
											{#each property.images as _, index}
												<button
													on:click={() => currentImageIndex = index}
													class="w-2 h-2 rounded-full {index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}"
												></button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
							
							{#if property.images.length > 1}
								<div class="p-4">
									<div class="flex space-x-2 overflow-x-auto">
										{#each property.images as image, index}
											<button
												on:click={() => currentImageIndex = index}
												class="flex-shrink-0"
											>
												<img 
													src={image.imageUrl} 
													alt={property.title}
													class="w-16 h-16 object-cover rounded-md {index === currentImageIndex ? 'ring-2 ring-green-500' : ''}"
													on:error={(e) => {
														console.error('Thumbnail failed to load:', image.imageUrl);
														e.target.src = '/placeholder-property.jpg';
													}}
												/>
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<div class="flex items-center justify-center h-64 lg:h-96 bg-gray-100">
								<div class="text-center">
									<Camera class="w-12 h-12 text-gray-400 mx-auto mb-2" />
									<p class="text-gray-500">No images uploaded</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Property Details -->
				<div class="space-y-6">
					{#if showEditMode}
						<!-- Edit Form -->
						<div class="bg-white rounded-lg shadow p-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Edit Property</h3>
							
							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
									<input 
										type="text" 
										bind:value={editForm.title}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
									<textarea 
										bind:value={editForm.description}
										rows="4"
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
									></textarea>
								</div>
								
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
										<input 
											type="number" 
											bind:value={editForm.price}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
										<select 
											bind:value={editForm.status}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										>
											<option value="ACTIVE">Active</option>
											<option value="PENDING">Pending</option>
											<option value="SOLD">Sold</option>
											<option value="RENTED">Rented</option>
										</select>
									</div>
								</div>
								
								<div class="grid grid-cols-3 gap-4">
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
										<input 
											type="number" 
											bind:value={editForm.bedrooms}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
										<input 
											type="number" 
											bind:value={editForm.bathrooms}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">Sqft</label>
										<input 
											type="number" 
											bind:value={editForm.sqft}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										/>
									</div>
								</div>
								
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">City</label>
										<input 
											type="text" 
											bind:value={editForm.city}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">State</label>
										<input 
											type="text" 
											bind:value={editForm.state}
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
										/>
									</div>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
									<input 
										type="text" 
										bind:value={editForm.address}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
									/>
								</div>
								
								<div class="flex space-x-3 pt-4">
									<button 
										on:click={updateProperty}
										class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
									>
										Save Changes
									</button>
									<button 
										on:click={() => showEditMode = false}
										class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
									>
										Cancel
									</button>
								</div>
							</div>
						</div>
					{:else}
						<!-- Property Info -->
						<div class="bg-white rounded-lg shadow p-6">
							<div class="flex items-start justify-between mb-4">
								<h1 class="text-2xl font-bold text-gray-900">{property.title}</h1>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
									property.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
									property.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
									property.status === 'SOLD' || property.status === 'RENTED' ? 'bg-red-100 text-red-800' :
									'bg-gray-100 text-gray-800'
								}">
									{property.status}
								</span>
							</div>
							
							<div class="space-y-4">
								<div class="flex items-center text-gray-600">
									<MapPin class="w-5 h-5 mr-2" />
									<span>{property.address}</span>
								</div>
								
								<div class="flex items-center text-gray-600">
									<span class="text-2xl font-bold text-green-600">₦{property.price.toLocaleString()}</span>
									<span class="ml-2 text-sm capitalize">for {property.listingType.toLowerCase()}</span>
								</div>
								
								<div class="grid grid-cols-3 gap-4 pt-4 border-t">
									{#if property.bedrooms}
										<div class="text-center">
											<div class="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
											<div class="text-sm text-gray-500">Bedrooms</div>
										</div>
									{/if}
									{#if property.bathrooms}
										<div class="text-center">
											<div class="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
											<div class="text-sm text-gray-500">Bathrooms</div>
										</div>
									{/if}
									{#if property.sqft}
										<div class="text-center">
											<div class="text-2xl font-bold text-gray-900">{property.sqft}</div>
											<div class="text-sm text-gray-500">Sqft</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
						
						<!-- Description -->
						{#if property.description}
							<div class="bg-white rounded-lg shadow p-6">
								<h3 class="text-lg font-medium text-gray-900 mb-3">Description</h3>
								<p class="text-gray-600 leading-relaxed">{property.description}</p>
							</div>
						{/if}
						
						<!-- Features -->
						{#if property.features}
							{@const features = parseFeatures(property.features)}
							{#if features.length > 0}
								<div class="bg-white rounded-lg shadow p-6">
									<h3 class="text-lg font-medium text-gray-900 mb-3">Features & Amenities</h3>
									<div class="grid grid-cols-1 gap-2">
										{#each features as feature}
											<div class="flex items-center">
												<div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
												<span class="text-gray-600">{feature}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/if}
						
						<!-- Property Stats -->
						<div class="bg-white rounded-lg shadow p-6">
							<h3 class="text-lg font-medium text-gray-900 mb-3">Property Statistics</h3>
							<div class="space-y-3">
								<div class="flex justify-between">
									<span class="text-gray-600">Views</span>
									<span class="font-medium">{property.viewsCount}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Property Type</span>
									<span class="font-medium capitalize">{property.propertyType}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Listed</span>
									<span class="font-medium">{formatDate(property.createdAt)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Last Updated</span>
									<span class="font-medium">{formatDate(property.updatedAt)}</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
