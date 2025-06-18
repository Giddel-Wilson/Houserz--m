<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Heart, 
		MapPin, 
		Bed, 
		Bath, 
		Home,
		MessageSquare,
		Settings,
		User,
		Calendar,
		Search,
		LogOut,
		Menu,
		X
	} from 'lucide-svelte';

	let user: any = null;
	let savedProperties: any[] = [];
	let messages: any[] = [];
	let viewingRequests: any[] = [];
	let loading = true;
	let currentPage = 'favorites';
	let sidebarOpen = false;
	let retryCount = 0;
	let showRetry = false;

	onMount(async () => {
		console.log('🚀 Favorites page mounting...');
		
		// Check if user data exists in localStorage
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		console.log('📋 Auth check:');
		console.log('- User data exists:', !!userData);
		console.log('- Token exists:', !!token);
		
		if (!userData) {
			console.log('❌ No user data, redirecting to login');
			goto('/login');
			return;
		}
		
		try {
			user = JSON.parse(userData);
			console.log('👤 User parsed:', user.fullName, 'Role:', user.role);
		} catch (parseError) {
			console.error('❌ Failed to parse user data:', parseError);
			goto('/login');
			return;
		}
		
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

		console.log('✅ User authenticated:', user.fullName);

		// Set a timeout fallback to ensure loading state is resolved
		const timeoutId = setTimeout(() => {
			console.warn('⏰ Loading timeout reached, forcing loading to false');
			loading = false;
			if (savedProperties.length === 0) {
				showRetry = true;
			}
		}, 5000); // 5 second timeout

		try {
			// Load saved properties first (this controls the main loading state)
			await loadSavedProperties();
			
			// Clear timeout since loading completed successfully
			clearTimeout(timeoutId);
		} catch (error) {
			console.error('💥 Critical error in onMount:', error);
			loading = false;
			showRetry = true;
			clearTimeout(timeoutId);
		}
		
		// Load dashboard data separately (don't wait for it, and don't let it affect loading state)
		loadDashboardData().catch(error => {
			console.error('⚠️ Dashboard data loading failed:', error);
		});
	});

	async function loadSavedProperties() {
		try {
			console.log('📥 Loading saved properties...');
			
			const token = localStorage.getItem('token');
			console.log('🔑 Token check:', token ? `Token exists (length: ${token.length})` : 'No token found');
			
			if (!token) {
				console.error('❌ No authentication token found');
				savedProperties = [];
				showRetry = true;
				return;
			}
			
			const response = await fetch('/api/user/favorites', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			console.log('📡 Favorites API response status:', response.status);

			if (response.ok) {
				const data = await response.json();
				console.log('📊 Favorites API data received:', data);
				
				// Ensure data.favorites exists and is an array
				if (data.favorites && Array.isArray(data.favorites)) {
					console.log('✅ Valid favorites data, count:', data.favorites.length);
					
					// Transform favorites data to match expected format
					savedProperties = data.favorites.map(favorite => {
						try {
							const transformed = {
								id: favorite.id,
								title: favorite.title || 'Untitled Property',
								price: favorite.price || 0,
								location: favorite.location || 'Unknown Location',
								image: favorite.images?.find(img => img.is_primary)?.image_url || 
									   favorite.images?.[0]?.image_url || 
									   '/placeholder-property.jpg',
								bedrooms: favorite.bedrooms || 0,
								bathrooms: favorite.bathrooms || 0,
								area: favorite.square_feet || 0,
								propertyType: favorite.property_type || 'Unknown',
								savedAt: favorite.favorited_at ? new Date(favorite.favorited_at).toLocaleDateString() : 'Unknown'
							};
							console.log('✅ Transformed favorite:', transformed.title);
							return transformed;
						} catch (transformError) {
							console.error('❌ Error transforming favorite:', transformError, favorite);
							return null;
						}
					}).filter(item => item !== null); // Remove any failed transformations
					
					console.log('🏠 Final saved properties count:', savedProperties.length);
				} else {
					console.warn('⚠️ Invalid favorites data structure:', data);
					savedProperties = [];
				}
			} else {
				console.error('❌ Failed to load favorites - status:', response.status);
				const errorText = await response.text();
				console.error('❌ Error response:', errorText);
				savedProperties = [];
			}
		} catch (error) {
			console.error('💥 Error loading saved properties:', error);
			savedProperties = [];
			showRetry = true;
		} finally {
			console.log('🏁 Setting loading to false');
			loading = false;
		}
	}

	async function loadDashboardData() {
		try {
			console.log('Loading dashboard data...');
			
			// Load viewing requests for sidebar count
			const viewingResponse = await fetch('/api/user/viewings', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (viewingResponse.ok) {
				const viewingData = await viewingResponse.json();
				viewingRequests = viewingData.viewings || [];
				console.log('Loaded viewing requests:', viewingRequests.length);
			} else {
				console.warn('Failed to load viewing requests:', viewingResponse.status);
				viewingRequests = [];
			}

			// Load messages (placeholder - implement when messages API is ready)
			messages = [];
			console.log('Dashboard data loading completed');
		} catch (error) {
			console.error('Error loading dashboard data:', error);
			// Set defaults to ensure page still works
			viewingRequests = [];
			messages = [];
		}
	}

	async function removeFavorite(propertyId: number) {
		try {
			const response = await fetch(`/api/user/favorites/${propertyId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (response.ok) {
				savedProperties = savedProperties.filter(p => p.id !== propertyId);
			} else {
				console.error('Failed to remove favorite');
			}
		} catch (error) {
			console.error('Error removing favorite:', error);
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

	async function retryLoading() {
		retryCount++;
		loading = true;
		showRetry = false;
		console.log('Retrying to load favorites, attempt:', retryCount);
		await loadSavedProperties();
	}
</script>

<svelte:head>
	<title>Saved Properties - Houserz</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
	<div class="flex">
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
			md:w-[50%] lg:static lg:w-64
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
		<div class="flex-1 p-4 lg:ml-0 lg:p-8">
			<!-- Header -->
			<div class="mt-12 mb-6 flex items-center justify-between lg:mt-0 lg:mb-8">
				<div>
					<h1 class="text-xl font-bold text-gray-900 lg:text-2xl">Saved Properties</h1>
					<p class="text-sm text-gray-600 lg:text-base">Your favorite properties you want to remember</p>
				</div>
			</div>

			{#if loading}
				<div class="flex flex-col items-center justify-center py-12">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
					<p class="text-gray-600 text-sm">
						{retryCount > 0 ? `Retrying... (Attempt ${retryCount + 1})` : 'Loading your saved properties...'}
					</p>
					{#if retryCount > 0}
						<p class="text-gray-500 text-xs mt-2">Please wait while we fetch your favorites</p>
					{/if}
				</div>
			{:else if savedProperties.length > 0}
				<div class="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each savedProperties as property}
						<div class="bg-white rounded-xl shadow-sm overflow-hidden">
							<div class="relative">
								<img
									src={property.image}
									alt={property.title}
									class="w-full h-40 lg:h-48 object-cover"
								/>
								<button
									on:click={() => removeFavorite(property.id)}
									class="absolute top-3 right-3 p-1.5 lg:p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
									title="Remove from favorites"
								>
									<Heart class="w-4 h-4 lg:w-5 lg:h-5 text-red-500 fill-current" />
								</button>
							</div>
							<div class="p-4 lg:p-6">
								<h3 class="text-base lg:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
								<div class="flex items-center text-gray-600 mb-3">
									<MapPin class="w-3 h-3 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
									<span class="text-xs lg:text-sm truncate">{property.location}</span>
								</div>
								<div class="flex items-center space-x-3 lg:space-x-4 text-xs lg:text-sm text-gray-600 mb-4">
									<div class="flex items-center">
										<Bed class="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
										<span>{property.bedrooms} beds</span>
									</div>
									<div class="flex items-center">
										<Bath class="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
										<span>{property.bathrooms} baths</span>
									</div>
									<div>
										<span>{property.area} sqft</span>
									</div>
								</div>
								<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
									<div>
										<p class="text-lg lg:text-2xl font-bold text-green-600">₦{property.price.toLocaleString()}</p>
										<p class="text-xs text-gray-500">Saved on {property.savedAt}</p>
									</div>
									<a
										href="/dashboard/properties/{property.id}"
										class="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs lg:text-sm text-center"
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
						<Heart class="mx-auto h-12 w-12 text-gray-400" />
						<h3 class="mt-4 text-lg font-medium text-gray-900">No saved properties</h3>
						<p class="mt-2 text-sm text-gray-500">Start browsing properties and save your favorites!</p>
						<div class="mt-6">
							<a
								href="/dashboard/properties"
								class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
							>
								Browse Properties
							</a>
						</div>
					</div>
				</div>
			{/if}

			{#if !loading && showRetry}
				<div class="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
					<div class="text-yellow-800">
						<p class="text-sm font-medium mb-2">
							⚠️ Unable to load your saved properties
						</p>
						<p class="text-xs text-yellow-700 mb-3">
							This might be due to a connection issue. Please check your internet connection and try again.
						</p>
						<button 
							on:click={retryLoading} 
							class="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
