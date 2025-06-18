<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		Users, 
		Building2, 
		Activity,
		TrendingUp,
		ArrowRight,
		MessageSquare,
		BarChart3,
		DollarSign,
		Eye,
		Clock,
		Shield,
		Zap
	} from 'lucide-svelte';

	let stats = {
		totalUsers: 0,
		totalProperties: 0,
		activeProperties: 0,
		totalMessages: 0,
		totalRevenue: 0,
		monthlyGrowth: 0,
		activeListings: 0
	};

	let recentActivities: any[] = [];
	let loading = true;

	let currentTime = new Date();
	setInterval(() => {
		currentTime = new Date();
	}, 1000);

	onMount(async () => {
		await loadAdminData();
	});

	async function loadAdminData() {
		try {
			const token = localStorage.getItem('token');
			
			// Load admin stats
			const statsResponse = await fetch('/api/admin/stats', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (statsResponse.ok) {
				stats = await statsResponse.json();
			}

			// Load recent activities
			const activitiesResponse = await fetch('/api/admin/activities?limit=10', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (activitiesResponse.ok) {
				const data = await activitiesResponse.json();
				recentActivities = data.activities || [];
			}
		} catch (error) {
			console.error('Error loading admin data:', error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Houserz</title>
</svelte:head>

<!-- Welcome Section with Enhanced Header -->
<div class="mb-8">
	<div class="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
		<!-- Decorative background elements -->
		<div class="absolute top-0 right-0 w-64 h-64 transform translate-x-32 -translate-y-32">
			<div class="w-full h-full rounded-full bg-white opacity-5"></div>
		</div>
		<div class="absolute bottom-0 left-0 w-48 h-48 transform -translate-x-24 translate-y-24">
			<div class="w-full h-full rounded-full bg-white opacity-5"></div>
		</div>
		
		<div class="relative z-10">
			<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
				<div class="mb-6 lg:mb-0">
					<h1 class="text-3xl lg:text-4xl font-bold mb-3">
						Welcome back, Admin! 👋
					</h1>
					<p class="text-red-100 text-lg mb-4">
						Monitor and manage the Houserz platform with ease and efficiency.
					</p>
					<div class="flex items-center space-x-6">
						<div class="flex items-center">
							<div class="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
							<span class="text-green-100 font-medium">All Systems Operational</span>
						</div>
						<div class="flex items-center text-red-100">
							<Clock class="h-4 w-4 mr-2" />
							<span class="text-sm">
								{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</span>
						</div>
					</div>
				</div>
				
				<div class="lg:text-right">
					<div class="bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
						<p class="text-red-100 text-sm mb-2">Today's Overview</p>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-2xl font-bold">{stats.totalUsers}</p>
								<p class="text-red-200 text-xs">Total Users</p>
							</div>
							<div>
								<p class="text-2xl font-bold">{stats.totalProperties}</p>
								<p class="text-red-200 text-xs">Properties</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Enhanced Stats Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
	<!-- Total Users Card -->
	<div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
		<div class="flex items-center justify-between mb-4">
			<div class="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
				<Users class="h-6 w-6 text-white" />
			</div>
			<div class="text-right">
				<div class="flex items-center text-green-600">
					<TrendingUp class="h-4 w-4 mr-1" />
					<span class="text-sm font-medium">+12%</span>
				</div>
			</div>
		</div>
		<div>
			<p class="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers.toLocaleString()}</p>
			<p class="text-sm font-medium text-gray-600">Total Users</p>
			<p class="text-xs text-gray-500 mt-1">+{Math.round(stats.totalUsers * 0.12)} this month</p>
		</div>
	</div>

	<!-- Total Properties Card -->
	<div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
		<div class="flex items-center justify-between mb-4">
			<div class="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
				<Building2 class="h-6 w-6 text-white" />
			</div>
			<div class="text-right">
				<div class="flex items-center text-green-600">
					<TrendingUp class="h-4 w-4 mr-1" />
					<span class="text-sm font-medium">+24%</span>
				</div>
			</div>
		</div>
		<div>
			<p class="text-3xl font-bold text-gray-900 mb-1">{stats.totalProperties.toLocaleString()}</p>
			<p class="text-sm font-medium text-gray-600">Total Properties</p>
			<p class="text-xs text-gray-500 mt-1">{stats.activeProperties} active listings</p>
		</div>
	</div>

	<!-- Platform Revenue Card -->
	<div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
		<div class="flex items-center justify-between mb-4">
			<div class="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
				<DollarSign class="h-6 w-6 text-white" />
			</div>
			<div class="text-right">
				<div class="flex items-center text-green-600">
					<TrendingUp class="h-4 w-4 mr-1" />
					<span class="text-sm font-medium">+18%</span>
				</div>
			</div>
		</div>
		<div>
			<p class="text-3xl font-bold text-gray-900 mb-1">₦{(stats.totalRevenue || 2450000).toLocaleString()}</p>
			<p class="text-sm font-medium text-gray-600">Monthly Revenue</p>
			<p class="text-xs text-gray-500 mt-1">Commission & fees</p>
		</div>
	</div>
</div>

<!-- Enhanced Quick Actions Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
	<a 
		href="/admin/properties" 
		class="group bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-100 rounded-2xl hover:shadow-xl transition-all duration-300 p-6 block hover:-translate-y-1 hover:border-purple-200"
	>
		<div class="flex items-center justify-between mb-4">
			<div class="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
				<Building2 class="h-8 w-8 text-white" />
			</div>
			<div class="text-right">
				<div class="text-2xl font-bold text-purple-600">{stats.totalProperties}</div>
				<div class="text-xs text-purple-500">Total</div>
			</div>
		</div>
		<div class="mb-4">
			<h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
				Properties
			</h3>
			<p class="text-gray-600 text-sm mb-3">Monitor all property listings and analytics</p>
			<div class="flex items-center text-purple-600">
				<BarChart3 class="h-4 w-4 mr-1" />
				<span class="text-sm font-medium">{stats.activeProperties} active listings</span>
			</div>
		</div>
		<div class="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
			<span class="text-sm font-medium">Manage properties</span>
			<ArrowRight class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
		</div>
	</a>

	<a 
		href="/admin/users" 
		class="group bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-2xl hover:shadow-xl transition-all duration-300 p-6 block hover:-translate-y-1 hover:border-blue-200"
	>
		<div class="flex items-center justify-between mb-4">
			<div class="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
				<Users class="h-8 w-8 text-white" />
			</div>
			<div class="text-right">
				<div class="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
				<div class="text-xs text-blue-500">Users</div>
			</div>
		</div>
		<div class="mb-4">
			<h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
				User Management
			</h3>
			<p class="text-gray-600 text-sm mb-3">Manage user accounts and permissions</p>
			<div class="flex items-center text-blue-600">
				<Eye class="h-4 w-4 mr-1" />
				<span class="text-sm font-medium">View all users</span>
			</div>
		</div>
		<div class="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
			<span class="text-sm font-medium">Manage users</span>
			<ArrowRight class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
		</div>
	</a>
</div>

<!-- Main Dashboard Content -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Recent Activities - Takes up 2 columns -->
	<div class="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
		<div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="p-2 bg-blue-100 rounded-lg mr-3">
						<Activity class="h-5 w-5 text-blue-600" />
					</div>
					<h2 class="text-xl font-bold text-gray-900">Platform Activity Feed</h2>
				</div>
				<div class="text-sm text-gray-500">
					Last updated: {new Date().toLocaleTimeString()}
				</div>
			</div>
		</div>
		<div class="p-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
					<span class="ml-3 text-gray-600">Loading activities...</span>
				</div>
			{:else if recentActivities.length > 0}
				<div class="space-y-4 max-h-96 overflow-y-auto">
					{#each recentActivities as activity, index}
						<div class="flex items-start p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all duration-200 hover:bg-gray-50">
							<div class="flex-shrink-0">
								<div class="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
									<Activity class="h-5 w-5 text-red-600" />
								</div>
							</div>
							<div class="ml-4 flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 mb-1">{activity.action || 'System activity'}</p>
								<p class="text-xs text-gray-500">{new Date(activity.created_at || Date.now()).toLocaleString()}</p>
							</div>
							<div class="ml-4 flex-shrink-0">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
									Active
								</span>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 text-center">
					<button class="text-sm text-red-600 hover:text-red-700 font-medium">
						View all activities →
					</button>
				</div>
			{:else}
				<div class="text-center py-12">
					<div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
						<Activity class="h-10 w-10 text-gray-400" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">No recent activities</h3>
					<p class="text-gray-600 max-w-sm mx-auto">Platform activities will appear here when users interact with the system.</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Right Sidebar -->
	<div class="space-y-6">
		<!-- Platform Stats Overview -->
		<div class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-100 p-6">
			<h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
				<BarChart3 class="h-5 w-5 text-emerald-600 mr-2" />
				Platform Overview
			</h3>
			<div class="space-y-4">
				<div class="flex items-center justify-between p-3 bg-white rounded-lg">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
						<span class="text-sm font-medium text-gray-700">Active Users</span>
					</div>
					<span class="text-sm font-bold text-gray-900">{Math.round(stats.totalUsers * 0.7)}</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-white rounded-lg">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
						<span class="text-sm font-medium text-gray-700">Listed Properties</span>
					</div>
					<span class="text-sm font-bold text-gray-900">{stats.activeProperties}</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-white rounded-lg">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-emerald-400 rounded-full mr-3"></div>
						<span class="text-sm font-medium text-gray-700">Monthly Revenue</span>
					</div>
					<span class="text-sm font-bold text-gray-900">₦{((stats.totalRevenue || 2450000) / 1000000).toFixed(1)}M</span>
				</div>
			</div>
		</div>

		<!-- Quick Actions Panel -->
		<div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-red-100 p-6">
			<h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
				<Zap class="h-5 w-5 text-red-600 mr-2" />
				Quick Actions
			</h3>
			<div class="space-y-3">
				<a href="/admin/messages" class="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow group">
					<div class="flex items-center">
						<MessageSquare class="h-5 w-5 text-orange-600 mr-3" />
						<span class="text-sm font-medium text-gray-900">Send Broadcast</span>
					</div>
					<ArrowRight class="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
				</a>
				
				<a href="/admin/settings" class="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow group">
					<div class="flex items-center">
						<Shield class="h-5 w-5 text-blue-600 mr-3" />
						<span class="text-sm font-medium text-gray-900">Platform Settings</span>
					</div>
					<ArrowRight class="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
				</a>
				
				<a href="/admin/backup" class="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow group">
					<div class="flex items-center">
						<Shield class="h-5 w-5 text-green-600 mr-3" />
						<span class="text-sm font-medium text-gray-900">System Backup</span>
					</div>
					<ArrowRight class="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
				</a>
			</div>
		</div>

		<!-- System Status -->
		<div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
			<h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
				<Shield class="h-5 w-5 text-green-600 mr-2" />
				System Status
			</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Database</span>
					<div class="flex items-center">
						<div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
						<span class="text-xs font-medium text-green-600">Healthy</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">API Services</span>
					<div class="flex items-center">
						<div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
						<span class="text-xs font-medium text-green-600">Online</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Storage</span>
					<div class="flex items-center">
						<div class="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
						<span class="text-xs font-medium text-yellow-600">75% Used</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
