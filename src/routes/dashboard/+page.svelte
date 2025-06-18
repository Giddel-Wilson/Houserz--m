<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Home,
		Heart,
		MessageSquare,
		Settings,
		User,
		MapPin,
		Calendar,
		Search,
		LogOut,
		Bell,
		BarChart3,
		TrendingUp,
		DollarSign,
		Menu,
		X
	} from 'lucide-svelte';

	let user: any = null;
	let savedProperties: any[] = [];
	let recentViews: any[] = [];
	let messages: any[] = [];
	let loading = true;
	let currentPage = 'dashboard';
	let sidebarOpen = false;

	onMount(() => {
		// Check if user is authenticated
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (!userData || !token) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);

		// Redirect agents and admins to their respective dashboards
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

		// Fetch fresh user data from database
		fetchUserData();
		loadDashboardData();
	});

	async function fetchUserData() {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/user/profile', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
		if (response.ok) {
			const userData = await response.json();
			user = {
				...userData.user,
				// Ensure consistent field names
				full_name: userData.user.full_name || userData.user.fullName || userData.user.name,
				name: userData.user.full_name || userData.user.fullName || userData.user.name
			};
			// Update localStorage with fresh data
			localStorage.setItem('user', JSON.stringify(user));
		} else if (response.status === 401) {
				// Token invalid, redirect to login
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				goto('/login');
			}
		} catch (error) {
			console.error('Error fetching user data:', error);
		}
	}

	async function loadDashboardData() {
		try {
			// Load saved properties
			const favResponse = await fetch('/api/user/favorites', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (favResponse.ok) {
				const favData = await favResponse.json();
				savedProperties = favData.favorites.map(favorite => ({
					id: favorite.id,
					title: favorite.title,
					price: favorite.price,
					location: favorite.location,
					image: favorite.images?.find(img => img.is_primary)?.image_url || favorite.images?.[0]?.image_url || '/placeholder-property.jpg',
					bedrooms: favorite.bedrooms,
					bathrooms: favorite.bathrooms
				}));
			}

			// Load recent property views
			const viewsResponse = await fetch('/api/user/property-views', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (viewsResponse.ok) {
				const viewsData = await viewsResponse.json();
				recentViews = viewsData.views || [];
			}

			// Load messages
			const messagesResponse = await fetch('/api/user/messages', {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (messagesResponse.ok) {
				const messagesData = await messagesResponse.json();
				
				// Format messages for display
				messages = messagesData.conversations?.map(conv => {
					const lastMessage = conv.messages?.[0];
					return {
						id: conv.id,
						from: conv.initiatorId === user.id ? conv.receiver.fullName : conv.initiator.fullName,
						subject: conv.subject || 'No Subject',
						preview: lastMessage?.content?.substring(0, 50) + '...' || 'No messages',
						unread: conv.messages?.some(m => !m.isRead && m.senderId !== user.id) || false,
						timestamp: lastMessage?.createdAt || conv.lastMessageAt
					};
				}) || [];
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			loading = false;
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
</script>

<svelte:head>
	<title>Dashboard - Houserz</title>
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
					<h1 class="text-xl font-bold text-gray-900 lg:text-2xl">Dashboard</h1>
					<p class="hidden text-sm text-gray-600 sm:block lg:text-base">
						Welcome back, {user?.full_name || user?.name || 'User'}!
					</p>
				</div>
				<div class="flex items-center space-x-2 lg:space-x-4">
					<button class="p-2 text-gray-400 hover:text-gray-600">
						<Bell class="h-5 w-5 lg:h-6 lg:w-6" />
					</button>
					<button class="p-2 text-gray-400 hover:text-gray-600">
						<Search class="h-5 w-5 lg:h-6 lg:w-6" />
					</button>
				</div>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
				</div>
			{:else}
				<!-- Welcome Section -->
				<div class="mb-8 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white lg:p-8">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-xl font-bold lg:text-2xl">Welcome back, {user?.full_name || user?.name || 'User'}!</h2>
							<p class="mt-2 text-green-100 lg:text-lg">Ready to find your dream property?</p>
						</div>
						<div class="hidden lg:block">
							<div class="rounded-full bg-white/20 p-4">
								<Home class="h-8 w-8" />
							</div>
						</div>
					</div>
					<div class="mt-6 flex flex-col gap-3 sm:flex-row">
						<a 
							href="/dashboard/properties" 
							class="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-green-600 transition-all hover:bg-green-50"
						>
							<Search class="mr-2 h-4 w-4" />
							Browse Properties
						</a>
						<a 
							href="/dashboard/favorites" 
							class="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700"
						>
							<Heart class="mr-2 h-4 w-4" />
							View Saved ({savedProperties.length})
						</a>
					</div>
				</div>

				<!-- Stats Cards -->
				<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Saved Properties -->
					<div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Saved Properties</p>
								<p class="mt-1 text-2xl font-bold text-gray-900">{savedProperties.length}</p>
								<p class="mt-1 text-xs text-green-600">Your favorites</p>
							</div>
							<div class="rounded-lg bg-red-50 p-3">
								<Heart class="h-6 w-6 text-red-600" />
							</div>
						</div>
					</div>

					<!-- Properties Viewed -->
					<div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Recently Viewed</p>
								<p class="mt-1 text-2xl font-bold text-gray-900">{recentViews.length}</p>
								<p class="mt-1 text-xs text-purple-600">This month</p>
							</div>
							<div class="rounded-lg bg-purple-50 p-3">
								<TrendingUp class="h-6 w-6 text-purple-600" />
							</div>
						</div>
					</div>

					<!-- Messages -->
					<div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-600">Messages</p>
								<p class="mt-1 text-2xl font-bold text-gray-900">{messages.length}</p>
								<p class="mt-1 text-xs text-blue-600">
									{messages.filter(m => m.unread).length} unread
								</p>
							</div>
							<div class="rounded-lg bg-blue-50 p-3">
								<MessageSquare class="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</div>

					<!-- Quick Action -->
					<div class="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-sm hover:shadow-md transition-shadow">
						<div class="text-center">
							<div class="mx-auto mb-3 rounded-lg bg-white/20 p-3 w-fit">
								<Search class="h-6 w-6" />
							</div>
							<p class="text-sm font-medium opacity-90">Find Properties</p>
							<a href="/dashboard/properties" class="mt-2 block text-xs underline hover:no-underline">
								Start searching
							</a>
						</div>
					</div>
				</div>

				<!-- Main Content Grid -->
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<!-- Saved Properties -->
					<div class="lg:col-span-2">
						<div class="rounded-xl bg-white shadow-sm border border-gray-100">
							<div class="border-b border-gray-100 p-6">
								<div class="flex items-center justify-between">
									<h2 class="text-lg font-semibold text-gray-900">Your Saved Properties</h2>
									<a
										href="/dashboard/favorites"
										class="text-sm font-medium text-green-600 hover:text-green-700 flex items-center"
									>
										View all <span class="ml-1">→</span>
									</a>
								</div>
							</div>
							<div class="p-6">
								{#if savedProperties.length > 0}
									<div class="space-y-4">
										{#each savedProperties.slice(0, 3) as property}
											<div class="flex items-center space-x-4 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
												<img
													src={property.image}
													alt={property.title}
													class="h-16 w-16 rounded-lg object-cover"
												/>
												<div class="min-w-0 flex-1">
													<h3 class="font-medium text-gray-900 truncate">{property.title}</h3>
													<div class="mt-1 flex items-center text-sm text-gray-500">
														<MapPin class="mr-1 h-4 w-4 flex-shrink-0" />
														<span class="truncate">{property.location}</span>
													</div>
													<p class="mt-1 font-semibold text-green-600">
														₦{property.price.toLocaleString()}
													</p>
												</div>
												<div class="flex flex-col gap-2">
													<button class="text-red-500 hover:text-red-600 p-1">
														<Heart class="h-5 w-5 fill-current" />
													</button>
													<a 
														href="/dashboard/properties/{property.id}"
														class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
													>
														View
													</a>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="py-12 text-center">
										<div class="mx-auto mb-4 rounded-full bg-gray-100 p-4 w-fit">
											<Heart class="h-8 w-8 text-gray-400" />
										</div>
										<h3 class="text-lg font-medium text-gray-900">No saved properties yet</h3>
										<p class="mt-2 text-sm text-gray-500">Start browsing to save properties you're interested in</p>
										<a
											href="/dashboard/properties"
											class="mt-4 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
										>
											<Search class="mr-2 h-4 w-4" />
											Browse Properties
										</a>
									</div>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Recent Activity & Messages -->
					<div class="space-y-8">
						<!-- Recent Activity -->
						<div class="rounded-xl bg-white shadow-sm border border-gray-100">
							<div class="border-b border-gray-100 p-6">
								<h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
							</div>
							<div class="p-6">
								{#if recentViews.length > 0}
									<div class="space-y-3">
										{#each recentViews.slice(0, 3) as property}
											<div class="flex items-center space-x-3">
												<img
													src={property.image}
													alt={property.title}
													class="h-10 w-10 rounded-lg object-cover"
												/>
												<div class="min-w-0 flex-1">
													<p class="text-sm font-medium text-gray-900 truncate">{property.title}</p>
													<p class="text-xs text-gray-500">Viewed recently</p>
												</div>
												<span class="text-xs font-semibold text-green-600">
													₦{property.price.toLocaleString()}
												</span>
											</div>
										{/each}
									</div>
								{:else}
									<div class="py-6 text-center">
										<div class="mx-auto mb-3 rounded-full bg-gray-100 p-3 w-fit">
											<TrendingUp class="h-6 w-6 text-gray-400" />
										</div>
										<p class="text-sm text-gray-500">No recent activity</p>
										<a href="/dashboard/properties" class="text-xs text-green-600 hover:text-green-700 mt-1 block">
											Start exploring properties
										</a>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
