<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Search, 
		Filter, 
		MapPin, 
		Bed, 
		Bath, 
		Heart,
		Home,
		MessageSquare,
		Settings,
		User,
		Calendar,
		LogOut,
		Menu,
		X
	} from 'lucide-svelte';

	let user: any = null;
	let properties: any[] = [];
	let savedProperties: any[] = [];
	let viewingRequests: any[] = [];
	let messages: any[] = [];
	let loading = true;
	let currentPage = 'properties';
	let sidebarOpen = false;
	let searchTerm = '';
	let searchTimeout: NodeJS.Timeout;
	let selectedFilters = {
		location: '',
		minPrice: '',
		maxPrice: '',
		bedrooms: '',
		propertyType: ''
	};

	onMount(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			goto('/login');
			return;
		}
		
		user = JSON.parse(userData);
		
		// Redirect to appropriate dashboard based on role
		if (user.role === 'agent') {
			goto('/agent');
			return;
		}
		if (user.role === 'admin') {
			goto('/admin');
			return;
		}
		if (user.role !== 'client' && user.role !== 'buyer' && user.role !== 'CLIENT' && user.role !== 'BUYER') {
			console.log('❌ Invalid user role:', user.role, '- redirecting to login');
			goto('/login');
			return;
		}

		loadProperties();
		loadDashboardData();
	});

	async function loadProperties() {
		try {
			console.log('Dashboard: Loading properties...');
			
			// Build search parameters
			const params = new URLSearchParams();
			
			if (searchTerm) {
				params.append('search', searchTerm);
			}
			if (selectedFilters.location) {
				params.append('location', selectedFilters.location);
			}
			if (selectedFilters.propertyType) {
				params.append('type', selectedFilters.propertyType);
			}
			if (selectedFilters.minPrice) {
				params.append('minPrice', selectedFilters.minPrice);
			}
			if (selectedFilters.maxPrice) {
				params.append('maxPrice', selectedFilters.maxPrice);
			}
			if (selectedFilters.bedrooms) {
				params.append('bedrooms', selectedFilters.bedrooms);
			}
			
			console.log('Dashboard: Fetching from /api/properties with params:', params.toString());
			
			// Fetch properties from API - use relative URL to ensure correct port
			const response = await fetch(`/api/properties?${params}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			console.log('Dashboard: API response status:', response.status);

			if (response.ok) {
				const data = await response.json();
				console.log('Dashboard: Raw API response:', data);
				
				if (data.error) {
					console.warn('Dashboard: API returned error:', data.error);
					properties = [];
				} else if (data.properties && Array.isArray(data.properties)) {
					console.log('Dashboard: Processing properties:', data.properties);
					
					// Transform properties to match expected format
					properties = data.properties.map((property) => {
						return {
							id: property.id,
							title: property.title || 'Untitled Property',
							price: Number(property.price) || 0,
							location: property.location || `${property.city || ''}, ${property.state || ''}`.trim().replace(/^,|,$/, '') || 'Unknown Location',
							image: property.images?.length > 0 
								? (property.images.find(img => img.is_primary || img.isPrimary)?.image_url || property.images.find(img => img.imageUrl)?.imageUrl || property.images[0]?.image_url || property.images[0]?.imageUrl)
								: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==',
							bedrooms: property.bedrooms || 0,
							bathrooms: property.bathrooms || 0,
							area: property.square_feet || property.sqft || 0,
							propertyType: property.property_type || property.propertyType || 'Unknown',
							isSaved: false
						};
					});

					console.log('Dashboard: Final properties array:', properties);
					console.log('Dashboard: Properties count after transformation:', properties.length);
				} else {
					console.warn('Dashboard: No properties field in response');
					console.warn('Dashboard: Response keys:', Object.keys(data));
					properties = [];
				}

				// Load user's favorites to update isSaved status
				await loadUserFavorites();
			} else {
				console.error('Dashboard: HTTP error:', response.status, response.statusText);
				const errorText = await response.text();
				console.error('Dashboard: Error response body:', errorText);
				properties = [];
			}
		} catch (error) {
			console.error('Dashboard: Fetch error:', error);
			console.error('Dashboard: Error stack:', error.stack);
			properties = [];
		} finally {
			loading = false;
		}
	}

	async function loadUserFavorites() {
		try {
			const response = await fetch('/api/user/favorites', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				const favoriteIds = data.favorites.map(fav => fav.id);
				
				// Update properties with favorite status
				properties = properties.map(property => ({
					...property,
					isSaved: favoriteIds.includes(property.id)
				}));
			}
		} catch (error) {
			console.error('Error loading user favorites:', error);
		}
	}

	async function loadDashboardData() {
		try {
			// Load user favorites for sidebar count
			const favResponse = await fetch('/api/user/favorites', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (favResponse.ok) {
				const favData = await favResponse.json();
				savedProperties = favData.favorites.slice(0, 3); // Get first 3 for sidebar
			}

			// Load viewing requests
			const viewingResponse = await fetch('/api/user/viewings', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (viewingResponse.ok) {
				const viewingData = await viewingResponse.json();
				viewingRequests = viewingData.viewings || [];
			}

			// Load messages (placeholder - implement when messages API is ready)
			messages = [];
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		}
	}

	async function toggleSave(propertyId: number) {
		try {
			const property = properties.find(p => p.id === propertyId);
			if (!property) return;

			if (property.isSaved) {
				// Remove from favorites
				const response = await fetch(`/api/user/favorites/${propertyId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${localStorage.getItem('token')}`
					}
				});
				
				if (response.ok) {
					properties = properties.map(p => 
						p.id === propertyId ? { ...p, isSaved: false } : p
					);
					// Reload dashboard data to update sidebar counts
					await loadDashboardData();
				}
			} else {
				// Add to favorites
				const response = await fetch('/api/user/favorites', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ property_id: propertyId })
				});
				
				if (response.ok) {
					properties = properties.map(p => 
						p.id === propertyId ? { ...p, isSaved: true } : p
					);
					// Reload dashboard data to update sidebar counts
					await loadDashboardData();
				}
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
		}
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		goto('/');
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	// Add debounced search function
	function debouncedSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			loadProperties();
		}, 500); // Wait 500ms after user stops typing
	}

	// Update search term reactively
	$: if (searchTerm !== undefined) {
		debouncedSearch();
	}
</script>

<svelte:head>
	<title>Properties - Houserz</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
	<div class="flex h-screen">
		<!-- Mobile Menu Button -->
		<div class="fixed top-4 left-4 z-50 lg:hidden">
			<button
				on:click={toggleSidebar}
				class="rounded-lg bg-white p-2 text-gray-600 shadow-lg hover:text-gray-900"
			>
				{#if sidebarOpen}
					<X class="h-6 w-6" />
				{:else}
					<Menu class="h-6 w-6" />
				{/if}
			</button>
		</div>

		<!-- Sidebar Overlay -->
		{#if sidebarOpen}
			<div
				class="bg-opacity-50 fixed inset-0 z-30 bg-black lg:hidden"
				on:click={closeSidebar}
			></div>
		{/if}

		<!-- Sidebar -->
		<div
			class="
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
			fixed
			z-40 h-full
			w-64 bg-white shadow-lg transition-transform
			duration-300 ease-in-out
			md:w-[50%] lg:w-64
			lg:translate-x-0
		"
		>
			<div class="flex h-screen flex-col justify-between py-4">
				<div class="flex h-full flex-col justify-between">
					<div>
						<!-- User Profile -->
						<div class="border-b border-gray-200 p-4">
							<div class="flex flex-col items-center justify-center space-x-3">
								<div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
									<span class="flex justify-center text-sm font-semibold text-white">
										{(user?.full_name || user?.name || 'U').charAt(0)?.toUpperCase()}
									</span>
								</div>
								<div class="min-w-0 flex-1 flex-col justify-center">
									<p class="flex justify-center truncate text-xs text-gray-500">Welcome back!</p>
									<p
										class="flex justify-center truncate text-sm font-bold text-gray-900 md:text-base"
									>
										{user?.full_name || user?.name || 'User'}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Navigation -->
					<nav class="flex-1 space-y-1 px-2 py-4 flex flex-col space-y-4">
						<a
							href="/dashboard"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {currentPage === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={() => { closeSidebar(); }}
						>
							<Home class="mr-3 h-5 w-5" />
							Dashboard
						</a>

						<a
							href="/dashboard/properties"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/properties'); }}
						>
							<Search class="mr-3 h-5 w-5" />
							Properties
						</a>

						<a
							href="/dashboard/favorites"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/favorites'); }}
						>
							<Heart class="mr-3 h-5 w-5" />
							<span class="hidden sm:inline">Saved Properties</span>
							<span class="sm:hidden">Saved</span>
							{#if savedProperties.length > 0}
								<span class="ml-auto rounded-full bg-green-500 px-2 py-1 text-xs text-white">
									{savedProperties.length}
								</span>
							{/if}
						</a>

						<a
							href="/dashboard/messages"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/messages'); }}
						>
							<MessageSquare class="mr-3 h-5 w-5" />
							Messages
							{#if messages.some((m) => m.unread)}
								<span class="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs text-white">
									{messages.filter((m) => m.unread).length}
								</span>
							{/if}
						</a>

						<a
							href="/dashboard/profile"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/profile'); }}
						>
							<User class="mr-3 h-5 w-5" />
							Profile
						</a>
					</nav>
				</div>

				<!-- Logout -->
				<div class="border-t border-gray-200 p-4">
					<button
						on:click={logout}
						class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
					>
						<LogOut class="mr-3 h-5 w-5" />
						Logout
					</button>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="flex-1 lg:ml-64 overflow-y-auto py-8 px-4 lg:px-8">
			<!-- Header -->
			<div class="mt-12 mb-6 flex items-center justify-between lg:mt-0 lg:mb-8">
				<div>
					<h1 class="text-xl font-bold text-gray-900 lg:text-2xl">Browse Properties</h1>
					<p class="text-sm text-gray-600 lg:text-base">Find your perfect home</p>
				</div>
			</div>

			<!-- Search and Filters -->
			<div class="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-6">
				<div class="flex flex-col lg:flex-row gap-4">
					<!-- Search Input -->
					<div class="flex-1">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
							<input
								type="text"
								bind:value={searchTerm}
								placeholder="Search properties by location or title..."
								class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
								on:input={debouncedSearch}
							/>
						</div>
					</div>
					
					<!-- Filter Button -->
					<button class="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
						<Filter class="h-5 w-5 mr-2" />
						Filters
					</button>
					
					<!-- Search Button -->
					<button 
						on:click={loadProperties}
						class="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
					>
						<Search class="h-5 w-5 mr-2" />
						Search
					</button>
				</div>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
					<span class="ml-2 text-gray-600">Loading properties...</span>
				</div>
			{:else if properties.length > 0}
				<div class="mb-4">
					<p class="text-sm text-gray-600">Found {properties.length} properties</p>
				</div>
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 overflow-y-auto">
					{#each properties as property}
						<div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
							<div class="relative">
								<img
									src={property.image}
									alt={property.title}
									class="w-full h-48 object-cover"
									on:error={(e) => {
										e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
									}}
								/>
								<button
									on:click={() => toggleSave(property.id)}
									class="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
								>
									<Heart class="w-5 h-5 {property.isSaved ? 'text-red-500 fill-current' : 'text-gray-400'}" />
								</button>
							</div>
							<div class="p-6">
								<h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
								<div class="flex items-center text-gray-600 mb-3">
									<MapPin class="w-4 h-4 mr-1 flex-shrink-0" />
									<span class="text-sm truncate">{property.location}</span>
								</div>
								<div class="flex items-center space-x-4 text-sm text-gray-600 mb-4">
									<div class="flex items-center">
										<Bed class="w-4 h-4 mr-1" />
										<span>{property.bedrooms} beds</span>
									</div>
									<div class="flex items-center">
										<Bath class="w-4 h-4 mr-1" />
										<span>{property.bathrooms} baths</span>
									</div>
									<div>
										<span>{property.area} sqft</span>
									</div>
								</div>
								<div class="flex items-center justify-between">
									<p class="text-2xl font-bold text-green-600">₦{property.price.toLocaleString()}</p>
									<a
										href="/dashboard/properties/{property.id}"
										class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
									>
										View Details
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<div class="bg-white rounded-xl p-8 shadow-sm">
						<Search class="mx-auto h-12 w-12 text-gray-400" />
						<h3 class="mt-4 text-lg font-medium text-gray-900">No properties found</h3>
						<p class="mt-2 text-sm text-gray-500">
							{#if loading}
								Loading properties...
							{:else}
								Reload page or check back later.
							{/if}
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
