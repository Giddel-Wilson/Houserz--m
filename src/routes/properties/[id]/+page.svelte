<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		MapPin, Star, Bed, Bath, Square, Wifi, Car, Shield, 
		Heart, Share2, Phone, MessageSquare, Calendar, Camera,
		ChevronLeft, ChevronRight
	} from 'lucide-svelte';
	import Chat from '$lib/components/Chat.svelte';
	import ScheduleViewingModal from '$lib/components/ScheduleViewingModal.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	interface Property {
		id: number;
		title: string;
		description: string;
		location: string;
		price: string;
		property_type: string;
		bedrooms: number;
		bathrooms: number;
		square_feet: number;
		status: string;
		agent: {
			id: number;
			name: string;
			email: string;
			phone: string;
			whatsapp_link?: string;
		};
		images: Array<{ id: number; image_url: string; is_primary: boolean }>;
		amenities: string[];
		is_favorited?: boolean;
	}

	let property: Property | null = data?.property || null;
	let loading = false;
	let error = '';
	let currentImageIndex = 0;
	let showChat = false;
	let showScheduleModal = false;
	let user: any = null;

	$: propertyId = $page.params.id;

	onMount(() => {
		// Check if user is logged in
		const userData = localStorage.getItem('houserz_user');
		if (userData) {
			user = JSON.parse(userData);
		}
		
		// Debug: Log the property data
		console.log('Property data from server:', property);
		console.log('Property images:', property?.images);
		
		// If we don't have property data from server, try to load it client-side
		if (!property) {
			loadProperty();
		}
	});

	async function loadProperty() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};
			
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			
			const response = await fetch(`/api/properties/${propertyId}`, {
				headers
			});
			
			if (!response.ok) {
				if (response.status === 404) {
					error = 'Property not found';
				} else {
					error = 'Failed to load property details';
				}
				return;
			}
			
			const data = await response.json();
			property = {
				...(data.property || data),
				// Ensure proper data structure for compatibility
				images: (data.property?.images || data.images) || [],
				amenities: (data.property?.amenities || data.amenities) || [],
				agent: (data.property?.agent || data.agent) || null,
				is_favorited: (data.property?.is_favorited || data.is_favorited) || false
			};
			
		} catch (err) {
			console.error('Error loading property:', err);
			error = 'Failed to load property details';
		} finally {
			loading = false;
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

	async function toggleFavorite() {
		if (!user) {
			goto('/login');
			return;
		}
		
		try {
			const token = localStorage.getItem('houserz_token');
			
			if (property?.is_favorited) {
				// Remove from favorites
				const response = await fetch(`/api/user/favorites/${property.id}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				
				if (response.ok) {
					property.is_favorited = false;
				}
			} else {
				// Add to favorites
				const response = await fetch('/api/user/favorites', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ property_id: property?.id })
				});
				
				if (response.ok) {
					property.is_favorited = true;
				}
			}
		} catch (err) {
			console.error('Error toggling favorite:', err);
		}
	}

	function shareProperty() {
		if (navigator.share) {
			navigator.share({
				title: property?.title,
				text: `Check out this property: ${property?.title}`,
				url: window.location.href
			});
		} else {
			// Fallback - copy to clipboard
			navigator.clipboard.writeText(window.location.href);
		}
	}

	function openChat() {
		if (!user) {
			goto('/login');
			return;
		}
		showChat = true;
	}

	function scheduleViewing() {
		if (!user) {
			goto('/login');
			return;
		}
		showScheduleModal = true;
	}

	function onViewingScheduled(event) {
		const viewing = event.detail;
		console.log('Viewing scheduled:', viewing);
		// You could show a success notification here
		// or redirect to a viewings page
	}
</script>

<svelte:head>
	<title>{property?.title || 'Property Details'} - Houserz</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center space-x-4">
					<button on:click={() => history.back()} class="p-2 text-gray-400 hover:text-gray-600">
						<ChevronLeft class="w-5 h-5" />
					</button>
					<a href="/" class="text-2xl font-bold text-blue-600">Houserz</a>
				</div>
				{#if user}
					<div class="flex items-center space-x-4">
						<span class="text-sm text-gray-700">Welcome, {user.name}</span>
						<a href="/dashboard" class="text-blue-600 hover:text-blue-800 text-sm">Dashboard</a>
					</div>
				{:else}
					<div class="flex items-center space-x-4">
						<a href="/login" class="text-gray-700 hover:text-gray-900">Sign In</a>
						<a href="/register" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
							Get Started
						</a>
					</div>
				{/if}
			</div>
		</div>
	</nav>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
				{error}
			</div>
		</div>
	{:else if property}
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Main Content -->
				<div class="lg:col-span-2">
					<!-- Image Gallery -->
					<div class="relative mb-6">
						<div class="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
							{#if property.images.length > 0}
								<img 
									src={property.images[currentImageIndex]?.image_url || property.images[currentImageIndex]?.imageUrl || '/placeholder-property.jpg'} 
									alt={property.title}
									class="w-full h-full object-cover"
									on:error={(e) => {
										e.target.src = '/placeholder-property.jpg';
									}}
								/>
								<!-- Image Navigation -->
								{#if property.images.length > 1}
									<button 
										on:click={prevImage}
										class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
									>
										<ChevronLeft class="w-5 h-5" />
									</button>
									<button 
										on:click={nextImage}
										class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
									>
										<ChevronRight class="w-5 h-5" />
									</button>
									<!-- Image Indicators -->
									<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
										{#each property.images as _, index}
											<button 
												on:click={() => currentImageIndex = index}
												class="w-2 h-2 rounded-full {currentImageIndex === index ? 'bg-white' : 'bg-gray-400'}"
											></button>
										{/each}
									</div>
								{/if}
								<!-- Image Counter -->
								<div class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
									<Camera class="w-4 h-4 inline mr-1" />
									{currentImageIndex + 1} / {property.images.length}
								</div>
							{:else}
								<div class="flex items-center justify-center h-full">
									<span class="text-gray-500">No images available</span>
								</div>
							{/if}
						</div>
						
						<!-- Action Buttons -->
						<div class="absolute top-4 left-4 flex space-x-2">
							<div class="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
								For {property.status}
							</div>
						</div>
					</div>

					<!-- Property Details -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h1 class="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
								<div class="flex items-center text-gray-500 mb-2">
									<MapPin class="w-5 h-5 mr-2" />
									{property.location}
								</div>
								<div class="text-3xl font-bold text-blue-600">{property.price}/month</div>
							</div>
							<div class="flex space-x-2">
								<button 
									on:click={toggleFavorite}
									class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 {property.is_favorited ? 'bg-red-50 border-red-300' : ''}"
								>
									<Heart class="w-5 h-5 {property.is_favorited ? 'text-red-500 fill-current' : 'text-gray-400'}" />
								</button>
								<button 
									on:click={shareProperty}
									class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
								>
									<Share2 class="w-5 h-5 text-gray-400" />
								</button>
							</div>
						</div>

						<!-- Property Stats -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200">
							<div class="text-center">
								<div class="flex items-center justify-center mb-1">
									<Bed class="w-5 h-5 text-gray-400" />
								</div>
								<div class="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
								<div class="text-sm text-gray-500">Bedrooms</div>
							</div>
							<div class="text-center">
								<div class="flex items-center justify-center mb-1">
									<Bath class="w-5 h-5 text-gray-400" />
								</div>
								<div class="text-lg font-semibold text-gray-900">{property.bathrooms}</div>
								<div class="text-sm text-gray-500">Bathrooms</div>
							</div>
							<div class="text-center">
								<div class="flex items-center justify-center mb-1">
									<Square class="w-5 h-5 text-gray-400" />
								</div>
								<div class="text-lg font-semibold text-gray-900">{property.square_feet}</div>
								<div class="text-sm text-gray-500">Sq Ft</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-semibold text-gray-900">{property.property_type}</div>
								<div class="text-sm text-gray-500">Type</div>
							</div>
						</div>
					</div>

					<!-- Description -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">Description</h2>
						<p class="text-gray-600 leading-relaxed">{property.description}</p>
					</div>

					<!-- Amenities -->
					{#if property.amenities && property.amenities.length > 0}
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h2 class="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
							<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
								{#each property.amenities as amenity}
									<div class="flex items-center text-gray-600">
										<div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
										{amenity}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Sidebar -->
				<div class="lg:col-span-1">
					<!-- Agent Card -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 sticky top-24">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Contact Agent</h3>
						<div class="flex items-center mb-4">
							<div class="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
							<div>
								<div class="font-medium text-gray-900">{property.agent.name}</div>
								<div class="text-sm text-gray-500">Real Estate Agent</div>
							</div>
						</div>
						
						<div class="space-y-3 mb-6">
							
							{#if property.agent.whatsapp_link}
								<a 
									href={property.agent.whatsapp_link} 
									target="_blank"
									class="flex items-center justify-center w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
								>
									<MessageSquare class="w-4 h-4 mr-2" />
									WhatsApp
								</a>
							{/if}
							
							<button 
								on:click={openChat}
								class="flex items-center justify-center w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
							>
								<MessageSquare class="w-4 h-4 mr-2" />
								Live Chat
							</button>
						</div>

						<div class="text-sm text-gray-500 text-center">
							<p>Response time: Usually within 1 hour</p>
						</div>
					</div>

					<!-- Quick Info -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-500">Property ID:</span>
								<span class="text-gray-900">#HR{property.id.toString().padStart(4, '0')}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">Type:</span>
								<span class="text-gray-900">{property.property_type}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">Status:</span>
								<span class="text-gray-900 capitalize">For {property.status}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">Size:</span>
								<span class="text-gray-900">{property.square_feet} sq ft</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">Bedrooms:</span>
								<span class="text-gray-900">{property.bedrooms}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">Bathrooms:</span>
								<span class="text-gray-900">{property.bathrooms}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Chat Modal -->
{#if showChat && property && user}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg w-full max-w-md h-96 flex flex-col">
			<div class="p-4 border-b border-gray-200 flex items-center justify-between">
				<div>
					<h3 class="font-medium text-gray-900">Chat with {property.agent.name}</h3>
					<p class="text-sm text-gray-500">About: {property.title}</p>
				</div>
				<button 
					on:click={() => showChat = false}
					class="text-gray-400 hover:text-gray-600"
				>
					×
				</button>
			</div>
			<div class="flex-1">
				<Chat 
					propertyId={property.id}
					agentId={property.agent.id}
					userId={user.id}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Schedule Viewing Modal -->
{#if property && user}
	<ScheduleViewingModal 
		bind:show={showScheduleModal}
		{property}
		{user}
		on:scheduled={onViewingScheduled}
		on:close={() => showScheduleModal = false}
	/>
{/if}
