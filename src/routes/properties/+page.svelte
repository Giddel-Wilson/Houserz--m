<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { MapPin, Bed, Bath, Square, Search, Filter, Menu, X } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let properties = data.properties;
	let loading = false;
	let searchQuery = data.filters?.searchQuery || '';
	let selectedLocation = data.filters?.location || '';
	let selectedType = data.filters?.type || '';
	let selectedPriceRange = data.filters?.priceRange || '';
	let user: any = null;
	let mobileMenuOpen = false;

	const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];
	const propertyTypes = ['Apartment', 'House', 'Duplex', 'Bungalow', 'Commercial'];
	const priceRanges = ['₦10M - ₦50M', '₦50M - ₦100M', '₦100M - ₦200M', '₦200M+'];

	onMount(async () => {
		// Check if user is logged in
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (userData && token) {
			user = JSON.parse(userData);
			
			// Redirect authenticated buyers to dashboard version
			if (user.role === 'buyer' || user.role === 'BUYER') {
				// Preserve current search parameters when redirecting
				const currentParams = $page.url.searchParams.toString();
				const redirectUrl = currentParams ? 
					`/dashboard/properties?${currentParams}` : 
					'/dashboard/properties';
				goto(redirectUrl);
				return;
			}
		}
		
		// Debug: Check if we actually have properties from server-side load
		console.log('Properties from server:', properties);
		console.log('Properties length:', properties?.length || 0);
		
		// If no properties from server, try to fetch them client-side
		if (!properties || properties.length === 0) {
			console.log('No properties from server, fetching client-side...');
			await loadPropertiesClientSide();
		}
	});

	async function loadPropertiesClientSide() {
		try {
			console.log('Fetching properties from API...');
			const response = await fetch('/api/properties');
			console.log('API Response status:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('API Response data:', data);
				
				if (data.properties && Array.isArray(data.properties)) {
					properties = data.properties.map(property => ({
						...property,
						images: property.images?.map(img => img.image_url || img.imageUrl) || ['/placeholder-house.jpg']
					}));
					console.log('Updated properties:', properties);
					console.log('First property images:', properties[0]?.images);
				}
			} else {
				console.error('API Error:', response.status, response.statusText);
				const errorText = await response.text();
				console.error('Error details:', errorText);
			}
		} catch (error) {
			console.error('Client-side fetch error:', error);
		}
	}

	async function applyFilters() {
		loading = true;
		const searchParams = new URLSearchParams();
		
		if (searchQuery) searchParams.set('search', searchQuery);
		if (selectedLocation) searchParams.set('location', selectedLocation);
		if (selectedType) searchParams.set('type', selectedType);
		if (selectedPriceRange) searchParams.set('priceRange', selectedPriceRange);

		const queryString = searchParams.toString();
		const newUrl = queryString ? `/properties?${queryString}` : '/properties';
		
		await goto(newUrl);
		loading = false;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<svelte:head>
	<title>Properties - Houserz</title>
	<meta name="description" content="Browse premium properties in Nigeria. Find your dream home with verified listings from trusted agents." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
	<!-- Navigation -->
	<nav class="relative z-50 px-4 py-4 sm:px-6">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<a href="/" class="text-2xl font-bold">Houserz</a>

			<!-- Desktop Navigation -->
			<div class="hidden items-center space-x-8 lg:flex">
				<a href="/" class="transition-colors hover:text-green-400">Home</a>
				<a href="/properties" class="font-medium text-green-400">Properties</a>
				<a href="/contact" class="transition-colors hover:text-green-400">Contact</a>
				<a href="/about" class="transition-colors hover:text-green-400">About</a>
			</div>

			<!-- Auth Buttons -->
			<div class="hidden items-center space-x-4 lg:flex">
				{#if user}
					<a href="/dashboard" class="transition-colors hover:text-green-400">Dashboard</a>
					<button
						on:click={() => {
							localStorage.removeItem('token');
							localStorage.removeItem('user');
							user = null;
							window.location.reload();
						}}
						class="rounded-lg bg-red-500 px-4 py-2 transition-colors hover:bg-red-600"
					>
						Logout
					</button>
				{:else}
					<a href="/login" class="transition-colors hover:text-green-400">Sign In</a>
					<a href="/register" class="rounded-lg bg-green-500 px-4 py-2 transition-colors hover:bg-green-600">Get Started</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<div class="lg:hidden">
				<button on:click={toggleMobileMenu} class="text-white">
					{#if mobileMenuOpen}
						<X class="h-6 w-6" />
					{:else}
						<Menu class="h-6 w-6" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="lg:hidden">
				<div class="mt-4 rounded-lg px-4 py-6 shadow-xl border border-gray-400/30">
					<div class="space-y-4">
						<a href="/" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Home</a>
						<a href="/properties" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Properties</a>
						<a href="/contact" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Contact</a>
						<a href="/about" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>About</a>
					</div>
					<div class="mt-6 border-t border-gray-700 pt-6">
						{#if user}
							<div class="space-y-4">
								<a href="/dashboard" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Dashboard</a>
								<button
									on:click={() => {
										localStorage.removeItem('token');
										localStorage.removeItem('user');
										user = null;
										toggleMobileMenu();
										window.location.reload();
									}}
									class="w-full rounded-lg bg-red-500 px-4 py-2 text-left text-white transition-colors hover:bg-red-600"
								>
									Logout
								</button>
							</div>
						{:else}
							<div class="space-y-4">
								<a href="/login" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Sign In</a>
								<a href="/register" class="block w-full rounded-lg bg-green-500 px-4 py-2 text-center text-white transition-colors hover:bg-green-600" on:click={toggleMobileMenu}>Get Started</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</nav>

	<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 py-16">
		<h1 class="mb-4 text-3xl font-bold sm:mb-6 sm:text-5xl">Find Your Perfect Property</h1>
		<p class="text-base opacity-90 sm:text-xl">Discover premium properties across Nigeria with verified listings</p>
	</div>
</section>

<!-- Search Section -->
<section class="bg-white py-8 shadow-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="rounded-lg bg-gray-50 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Search Properties</h2>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div>
					<label class="block text-sm font-medium text-gray-700">Search</label>
					<div class="relative">
						<Search class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Enter location or keyword"
							class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
						/>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">Location</label>
					<select
						bind:value={selectedLocation}
						class="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
					>
						<option value="">All Locations</option>
						{#each locations as location}
							<option value={location}>{location}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">Property Type</label>
					<select
						bind:value={selectedType}
						class="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
					>
						<option value="">All Types</option>
						{#each propertyTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-end">
					<button
						on:click={applyFilters}
						disabled={loading}
						class="w-full rounded-lg bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
					>
						{loading ? 'Searching...' : 'Search'}
					</button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Properties Grid -->
<section class="bg-gray-50 py-12">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-8 flex items-center justify-between">
			<h2 class="text-2xl font-bold text-gray-800">Available Properties</h2>
			<p class="text-gray-600">{properties?.length || 0} properties found</p>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
			</div>
		{:else if !properties || properties.length === 0}
			<div class="py-12 text-center">
				<div class="mx-auto max-w-md">
					<div class="mx-auto h-12 w-12 text-gray-400">
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No properties available</h3>
					<p class="mt-1 text-sm text-gray-500">No properties have been listed yet. Check back later or contact agents directly.</p>
					{#if user && (user.role === 'AGENT' || user.role === 'agent')}
						<div class="mt-6">
							<a
								href="/agent/add-property"
								class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
							>
								Add your first property
							</a>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each properties as property}
					<a href="/properties/{property.id}" class="group block">
						<div class="overflow-hidden rounded-lg bg-white shadow-md transition-shadow group-hover:shadow-lg">
							<div class="relative h-48">
								{#if property.images && property.images.length > 0}
									<img 
										src={property.images[0]?.image_url || property.images[0]?.imageUrl || property.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='} 
										alt={property.title} 
										class="h-full w-full object-cover"
										on:error={(e) => {
											console.log('Image failed to load:', e.target.src);
											e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ci8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
										}}
										on:load={(e) => {
											console.log('Image loaded successfully:', e.target.src);
										}}
									/>
								{:else}
									<div class="h-full w-full bg-gray-200 flex items-center justify-center">
										<span class="text-gray-500">No Image Available</span>
									</div>
								{/if}
								{#if property.featured}
									<div class="absolute left-3 top-3 rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
										Featured
									</div>
								{/if}
								<div class="absolute right-3 top-3 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white capitalize">
									{property.listingType?.toLowerCase() || 'sale'}
								</div>
							</div>
							<div class="p-4">
								<h3 class="mb-2 text-lg font-semibold text-gray-800 group-hover:text-blue-600">{property.title}</h3>
								<div class="mb-2 flex items-center text-gray-600">
									<MapPin class="mr-1 h-4 w-4" />
									<span class="text-sm">{property.location}</span>
								</div>
								<div class="mb-1 text-xs text-gray-500 uppercase">{property.propertyType}</div>
								<div class="mb-3 text-xl font-bold text-gray-800">₦{property.price?.toLocaleString() || 'Price on request'}</div>
								<div class="flex items-center justify-between text-sm text-gray-600">
									{#if property.bedrooms}
										<div class="flex items-center">
											<Bed class="mr-1 h-4 w-4" />
											<span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
										</div>
									{/if}
									{#if property.bathrooms}
										<div class="flex items-center">
											<Bath class="mr-1 h-4 w-4" />
											<span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
										</div>
									{/if}
									{#if property.sqft}
										<div class="flex items-center">
											<Square class="mr-1 h-4 w-4" />
											<span>{property.sqft} sqft</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 py-12 text-white sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-6 grid grid-cols-1 gap-6 sm:mb-8 sm:grid-cols-2 sm:gap-8 md:grid-cols-4">
			<div class="text-center sm:text-left">
				<h3 class="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Houserz</h3>
				<p class="mb-3 text-sm text-gray-400 sm:mb-4 sm:text-base">
					Building your future, one property at a time.
				</p>
				<div class="flex justify-center space-x-4 sm:justify-start">
					<!-- Social media icons would go here -->
				</div>
			</div>
			<div class="text-center sm:text-left">
				<h4 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Quick Links</h4>
				<ul class="space-y-1 text-sm text-gray-400 sm:space-y-2 sm:text-base">
					<li><a href="/properties" class="transition-colors hover:text-white">Properties</a></li>
					<li><a href="/agents" class="transition-colors hover:text-white">Agents</a></li>
					<li><a href="/about" class="transition-colors hover:text-white">About Us</a></li>
					<li><a href="/contact" class="transition-colors hover:text-white">Contact</a></li>
				</ul>
			</div>
			<div class="text-center sm:text-left">
				<h4 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Services</h4>
				<ul class="space-y-1 text-sm text-gray-400 sm:space-y-2 sm:text-base">
					<li><a href="/properties?type=sale" class="transition-colors hover:text-white">Buy Property</a></li>
					<li><a href="/properties?type=rent" class="transition-colors hover:text-white">Rent Property</a></li>
					<li><a href="/contact" class="transition-colors hover:text-white">Property Management</a></li>
					<li><a href="/contact" class="transition-colors hover:text-white">Investment</a></li>
				</ul>
			</div>
			<div class="text-center sm:text-left">
				<h4 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
					Discover Nature's Wonders with Expert Guidance
				</h4>
				<p class="mb-3 text-sm text-gray-400 sm:mb-4">
					Find the perfect property that connects you with Nigeria's beautiful landscapes and urban
					centers.
				</p>
			</div>
		</div>
		<div
			class="flex flex-col items-center justify-between space-y-4 border-t border-gray-800 pt-6 sm:flex-row sm:space-y-0 sm:pt-8"
		>
			<p class="text-center text-xs text-gray-400 sm:text-left sm:text-sm">
				© 2025 Houserz. All rights reserved.
			</p>
			<div class="flex space-x-4 text-xs text-gray-400 sm:space-x-6 sm:text-sm">
				<a href="/privacy" class="transition-colors hover:text-white">Privacy Policy</a>
				<a href="/terms" class="transition-colors hover:text-white">Terms & Conditions</a>
			</div>
		</div>
	</div>
</footer>
