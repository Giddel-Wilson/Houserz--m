<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		ArrowLeft, 
		Edit, 
		Trash2, 
		MapPin, 
		Home, 
		Calendar,
		User,
		Phone,
		Mail,
		DollarSign,
		Eye,
		CheckCircle,
		XCircle,
		AlertTriangle
	} from 'lucide-svelte';
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

	$: propertyId = $page.params.id;

	onMount(() => {
		loadProperty();
	});

	async function loadProperty() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			
			const response = await fetch('/api/admin/properties/' + propertyId, {
				headers: {
					'Authorization': 'Bearer ' + token
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				property = data.property;
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

	async function updatePropertyStatus(newStatus: string) {
		if (!property) return;
		
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/properties/' + property.id + '/status', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + token
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				property.status = newStatus;
				showSuccess('Property status updated successfully');
			} else {
				showError('Failed to update property status');
			}
		} catch (error) {
			console.error('Error updating property status:', error);
			showError('Failed to update property status');
		}
	}

	async function deleteProperty() {
		if (!property) return;
		
		const result = await showDeleteConfirmation({
			title: 'Delete Property',
			message: `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
			confirmText: 'Delete Property',
			cancelText: 'Cancel'
		});

		if (result) {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch('/api/admin/properties/' + property.id, {
					method: 'DELETE',
					headers: {
						'Authorization': 'Bearer ' + token
					}
				});

				if (response.ok) {
					showSuccess('Property deleted successfully');
					goto('/admin/properties');
				} else {
					showError('Failed to delete property');
				}
			} catch (error) {
				console.error('Error deleting property:', error);
				showError('Failed to delete property');
			}
		}
	}

	function formatPrice(price: number) {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 0
		}).format(price);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string) {
		switch (status?.toLowerCase()) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'inactive': return 'bg-gray-100 text-gray-800';
			case 'sold': return 'bg-blue-100 text-blue-800';
			case 'rented': return 'bg-purple-100 text-purple-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function nextImage() {
		if (property?.images?.length) {
			currentImageIndex = (currentImageIndex + 1) % property.images.length;
		}
	}

	function prevImage() {
		if (property?.images?.length) {
			currentImageIndex = currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1;
		}
	}
</script>

<svelte:head>
	<title>{property ? `${property.title} - Admin` : 'Property Details - Admin'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<button 
				on:click={() => goto('/admin/properties')}
				class="flex items-center text-gray-600 hover:text-gray-900 mb-4"
			>
				<ArrowLeft class="h-5 w-5 mr-2" />
				Back to Properties
			</button>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<AlertTriangle class="h-12 w-12 text-red-500 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Property</h3>
				<p class="text-red-700">{error}</p>
				<button 
					on:click={loadProperty}
					class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
				>
					Try Again
				</button>
			</div>
		{:else if property}
			<div class="bg-white rounded-lg shadow overflow-hidden">
				<!-- Property Images -->
				{#if property.images?.length > 0}
					<div class="relative h-96">
						<img 
							src={property.images[currentImageIndex]?.imageUrl || '/placeholder-property.jpg'}
							alt={property.title}
							class="w-full h-full object-cover"
							on:error={(e) => {
								e.target.src = '/placeholder-property.jpg';
							}}
						/>
						
						{#if property.images.length > 1}
							<button 
								on:click={prevImage}
								class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
							>
								←
							</button>
							<button 
								on:click={nextImage}
								class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
							>
								→
							</button>
							
							<!-- Image indicators -->
							<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
								{#each property.images as _, index}
									<button
										on:click={() => currentImageIndex = index}
										class="w-2 h-2 rounded-full {index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}"
									></button>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<div class="h-96 bg-gray-200 flex items-center justify-center">
						<div class="text-center">
							<Home class="h-16 w-16 text-gray-400 mx-auto mb-4" />
							<p class="text-gray-500">No images available</p>
						</div>
					</div>
				{/if}

				<!-- Property Details -->
				<div class="p-6">
					<div class="flex justify-between items-start mb-6">
						<div>
							<h1 class="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
							<div class="flex items-center text-gray-600 mb-2">
								<MapPin class="h-5 w-5 mr-2" />
								<span>{property.address}, {property.city}, {property.state}</span>
							</div>
							<div class="flex items-center space-x-4">
								<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(property.status)}">
									{property.status}
								</span>
								<span class="text-sm text-gray-500">
									Listed on {formatDate(property.createdAt)}
								</span>
								<div class="flex items-center text-gray-500">
									<Eye class="h-4 w-4 mr-1" />
									<span class="text-sm">{property.viewsCount || 0} views</span>
								</div>
							</div>
						</div>
						
						<div class="text-right">
							<div class="text-3xl font-bold text-green-600 mb-4">
								{formatPrice(property.price)}
							</div>
							<div class="flex space-x-2">
								<select 
									value={property.status}
									on:change={(e) => updatePropertyStatus(e.target.value)}
									class="px-3 py-2 border border-gray-300 rounded-lg text-sm"
								>
									<option value="ACTIVE">Active</option>
									<option value="INACTIVE">Inactive</option>
									<option value="SOLD">Sold</option>
									<option value="RENTED">Rented</option>
								</select>
								<button
									on:click={deleteProperty}
									class="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
									title="Delete Property"
								>
									<Trash2 class="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>

					<!-- Property Info Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<div class="bg-gray-50 p-4 rounded-lg">
							<h3 class="text-sm font-medium text-gray-500 mb-1">Property Type</h3>
							<p class="text-lg font-semibold">{property.propertyType}</p>
						</div>
						<div class="bg-gray-50 p-4 rounded-lg">
							<h3 class="text-sm font-medium text-gray-500 mb-1">Listing Type</h3>
							<p class="text-lg font-semibold">{property.listingType}</p>
						</div>
						{#if property.bedrooms}
							<div class="bg-gray-50 p-4 rounded-lg">
								<h3 class="text-sm font-medium text-gray-500 mb-1">Bedrooms</h3>
								<p class="text-lg font-semibold">{property.bedrooms}</p>
							</div>
						{/if}
						{#if property.bathrooms}
							<div class="bg-gray-50 p-4 rounded-lg">
								<h3 class="text-sm font-medium text-gray-500 mb-1">Bathrooms</h3>
								<p class="text-lg font-semibold">{property.bathrooms}</p>
							</div>
						{/if}
						{#if property.sqft}
							<div class="bg-gray-50 p-4 rounded-lg">
								<h3 class="text-sm font-medium text-gray-500 mb-1">Square Feet</h3>
								<p class="text-lg font-semibold">{property.sqft.toLocaleString()}</p>
							</div>
						{/if}
					</div>

					<!-- Description -->
					{#if property.description}
						<div class="mb-8">
							<h2 class="text-xl font-bold text-gray-900 mb-4">Description</h2>
							<div class="prose max-w-none">
								<p class="text-gray-700 leading-relaxed">{property.description}</p>
							</div>
						</div>
					{/if}

					<!-- Features -->
					{#if property.features}
						<div class="mb-8">
							<h2 class="text-xl font-bold text-gray-900 mb-4">Features</h2>
							<div class="prose max-w-none">
								<p class="text-gray-700">{property.features}</p>
							</div>
						</div>
					{/if}

					<!-- Agent Information -->
					{#if property.agent}
						<div class="border-t pt-8">
							<h2 class="text-xl font-bold text-gray-900 mb-4">Agent Information</h2>
							<div class="bg-gray-50 p-6 rounded-lg">
								<div class="flex items-start space-x-4">
									<div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
										<User class="h-8 w-8 text-white" />
									</div>
									<div class="flex-1">
										<h3 class="text-lg font-semibold text-gray-900">{property.agent.fullName}</h3>
										<div class="mt-2 space-y-2">
											<div class="flex items-center text-gray-600">
												<Mail class="h-4 w-4 mr-2" />
												<a href="mailto:{property.agent.email}" class="hover:text-red-600">
													{property.agent.email}
												</a>
											</div>
											{#if property.agent.phone}
												<div class="flex items-center text-gray-600">
													<Phone class="h-4 w-4 mr-2" />
													<a href="tel:{property.agent.phone}" class="hover:text-red-600">
														{property.agent.phone}
													</a>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
