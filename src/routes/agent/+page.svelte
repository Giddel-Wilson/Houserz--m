<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Building2,
		Bell,
		MessageSquare,
		Eye,
		TrendingUp,
		Plus,
		ArrowRight,
		Activity
	} from 'lucide-svelte';

	let stats = {
		totalProperties: 0,
		activeListings: 0,
		totalViews: 0,
		messagesUnread: 0
	};

	let recentProperties: any[] = [];
	let loading = true;
	let user: any = null;

	onMount(async () => {
		// Get user data from localStorage
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		}
		
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			const token = localStorage.getItem('token');

			// Load agent stats
			const statsResponse = await fetch('/api/agent/stats', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (statsResponse.ok) {
				stats = await statsResponse.json();
			}

			// Load recent properties
			const propertiesResponse = await fetch('/api/agent/properties?limit=5', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (propertiesResponse.ok) {
				const data = await propertiesResponse.json();
				recentProperties = data.properties || [];
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Agent Dashboard - Houserz</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto px-4 py-1 lg:px-0 lg:py-0">
	<!-- Welcome Section -->
	<div class="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 p-4 lg:p-6 shadow-sm">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl lg:text-2xl font-bold text-gray-900 ml-8 lg:ml-auto">
					Welcome back{user?.fullName ? `, ${user.fullName}` : ''}!
				</h1>
				<p class="mt-1 text-sm lg:text-base text-gray-600">
					Here's an overview of your property management performance.
				</p>
				{#if stats.totalProperties === 0}
					<div class="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
						<Plus class="mr-1 h-4 w-4" />
						Ready to add your first property?
					</div>
				{:else}
					<div class="mt-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
						<TrendingUp class="mr-1 h-4 w-4" />
						Your portfolio is growing!
					</div>
				{/if}
			</div>
			<div class="hidden lg:block">
				<button class="rounded-lg p-2 text-gray-400 hover:bg-white/50 hover:text-gray-600 transition-colors">
					<Bell class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
		<div class="rounded-xl border border-gray-200 bg-white p-3 lg:p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs lg:text-sm font-medium text-gray-600">Total Properties</p>
					<p class="mt-1 text-lg lg:text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
				</div>
				<div class="rounded-lg bg-blue-100 p-2 lg:p-3">
					<Building2 class="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-3 lg:p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs lg:text-sm font-medium text-gray-600">Active Listings</p>
					<p class="mt-1 text-lg lg:text-2xl font-bold text-gray-900">{stats.activeListings}</p>
				</div>
				<div class="rounded-lg bg-green-100 p-2 lg:p-3">
					<TrendingUp class="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-3 lg:p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs lg:text-sm font-medium text-gray-600">Total Views</p>
					<p class="mt-1 text-lg lg:text-2xl font-bold text-gray-900">{stats.totalViews}</p>
				</div>
				<div class="rounded-lg bg-purple-100 p-2 lg:p-3">
					<Eye class="h-4 w-4 lg:h-6 lg:w-6 text-purple-600" />
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-3 lg:p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs lg:text-sm font-medium text-gray-600">Unread Messages</p>
					<p class="mt-1 text-lg lg:text-2xl font-bold text-gray-900">{stats.messagesUnread}</p>
				</div>
				<div class="rounded-lg bg-orange-100 p-2 lg:p-3">
					<MessageSquare class="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
				</div>
			</div>
			{#if stats.messagesUnread > 0}
				<div class="mt-2">
					<span class="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
						Needs attention
					</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
		<a
			href="/agent/properties"
			class="group block rounded-xl border border-gray-200 bg-white p-4 lg:p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="rounded-lg bg-blue-100 p-2 lg:p-3 transition-colors group-hover:bg-blue-200">
						<Building2 class="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
					</div>
					<div class="ml-3 lg:ml-4">
						<h3 class="text-sm lg:text-lg font-semibold text-gray-900">Manage Properties</h3>
						<p class="text-xs lg:text-sm text-gray-600">View and edit your listings</p>
					</div>
				</div>
				<ArrowRight class="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
			</div>
		</a>

		<a
			href="/agent/add-property"
			class="group block rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-4 lg:p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="rounded-lg bg-white/20 p-2 lg:p-3">
						<Plus class="h-6 w-6 lg:h-8 lg:w-8 text-white" />
					</div>
					<div class="ml-3 lg:ml-4">
						<h3 class="text-sm lg:text-lg font-semibold text-white">Add Property</h3>
						<p class="text-xs lg:text-sm text-green-100">Create a new listing</p>
					</div>
				</div>
				<ArrowRight class="h-4 w-4 lg:h-5 lg:w-5 text-white transition-colors group-hover:text-green-100" />
			</div>
		</a>

		<a
			href="/agent/messages"
			class="group block rounded-xl border border-gray-200 bg-white p-4 lg:p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="rounded-lg bg-orange-100 p-2 lg:p-3 transition-colors group-hover:bg-orange-200">
						<MessageSquare class="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
					</div>
					<div class="ml-3 lg:ml-4">
						<h3 class="text-sm lg:text-lg font-semibold text-gray-900">Messages</h3>
						<p class="text-xs lg:text-sm text-gray-600">{stats.messagesUnread} unread messages</p>
					</div>
				</div>
				<ArrowRight class="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
			</div>
		</a>

		<a
			href="/agent/profile"
			class="group block rounded-xl border border-gray-200 bg-white p-4 lg:p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="rounded-lg bg-gray-100 p-2 lg:p-3 transition-colors group-hover:bg-gray-200">
						<Activity class="h-6 w-6 lg:h-8 lg:w-8 text-gray-600" />
					</div>
					<div class="ml-3 lg:ml-4">
						<h3 class="text-sm lg:text-lg font-semibold text-gray-900">Profile Settings</h3>
						<p class="text-xs lg:text-sm text-gray-600">Update your information</p>
					</div>
				</div>
				<ArrowRight class="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
			</div>
		</a>
	</div>

	<!-- Recent Properties -->
	<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 lg:px-6 py-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Recent Properties</h2>
				<a
					href="/agent/properties"
					class="flex items-center text-sm font-medium text-green-600 hover:text-green-700"
				>
					View all
					<ArrowRight class="ml-1 h-4 w-4" />
				</a>
			</div>
		</div>
		<div class="p-4 lg:p-6">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<Activity class="h-6 w-6 animate-spin text-gray-400" />
					<span class="ml-2 text-gray-600">Loading properties...</span>
				</div>
			{:else if recentProperties.length > 0}
				<div class="space-y-4 max-h-96 overflow-y-auto">
					{#each recentProperties as property}
						<div class="flex items-center justify-between rounded-lg border border-gray-200 p-3 lg:p-4 transition-shadow hover:shadow-sm">
							<div class="flex items-center min-w-0 flex-1">
								<img
									src={property.images?.[0]?.image_url || '/house-1.jpg'}
									alt={property.title}
									class="h-12 w-12 lg:h-16 lg:w-16 rounded-lg object-cover flex-shrink-0"
								/>
								<div class="ml-3 lg:ml-4 min-w-0 flex-1">
									<h3 class="font-medium text-gray-900 truncate">{property.title}</h3>
									<p class="text-sm text-gray-600 truncate">{property.location}</p>
									<p class="text-sm font-semibold text-green-600">{formatCurrency(property.price)}</p>
								</div>
							</div>
							<div class="text-right flex-shrink-0 ml-3">
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {property.status ===
									'active'
										? 'bg-green-100 text-green-800'
										: 'bg-yellow-100 text-yellow-800'}"
								>
									{property.status}
								</span>
								<p class="mt-1 text-xs text-gray-500">{property.views || 0} views</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-12 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<Building2 class="h-8 w-8 text-gray-400" />
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-900">No properties yet</h3>
					<p class="mb-6 text-gray-600">Get started by adding your first property listing.</p>
					<a
						href="/agent/add-property"
						class="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-sm transition-colors hover:bg-green-600"
					>
						<Plus class="mr-2 h-4 w-4" />
						Add Your First Property
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
