<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { 
		Building2, 
		Calendar, 
		MessageSquare, 
		User, 
		BarChart3, 
		LogOut, 
		Plus,
		Menu,
		X,
		Bell,
		Settings,
		Home
	} from 'lucide-svelte';
	import NotificationContainer from '$lib/components/NotificationContainer.svelte';
	import ConfirmationContainer from '$lib/components/ConfirmationContainer.svelte';

	let user: any = null;
	let sidebarOpen = false;
	let loadingUser = true;

	onMount(async () => {
		// Check if user is authenticated and is an agent
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (!userData || !token) {
			goto('/login');
			return;
		}
		
		const localUser = JSON.parse(userData);
		console.log('Local user data:', localUser);
		
		// Check for both uppercase and lowercase agent role
		if (localUser.role !== 'agent' && localUser.role !== 'AGENT') {
			goto('/');
			return;
		}

		// Fetch fresh user data from database
		try {
			const response = await fetch('/api/user/profile', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const freshUserData = await response.json();
				console.log('Fresh user data from database:', freshUserData);
				user = freshUserData.user || freshUserData;
				
				// Update localStorage with fresh data
				localStorage.setItem('user', JSON.stringify(user));
			} else {
				// Fallback to localStorage data if API fails
				user = localUser;
			}
		} catch (error) {
			console.error('Error fetching fresh user data:', error);
			// Fallback to localStorage data
			user = localUser;
		}
		
		loadingUser = false;
	});

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

	// Helper function to get display name
	function getDisplayName(user: any) {
		if (!user) return 'Agent';
		
		// Check database field name first
		const name = user.full_name || user.fullName || user.name || 
		             user.firstName || user.first_name || user.username ||
		             user.displayName || user.display_name;
		
		console.log('All user fields:', Object.keys(user));
		console.log('Display name result:', name);
		return name || user.email?.split('@')[0] || 'Agent';
	}

	function getInitials(user: any) {
		if (!user) return 'A';
		
		const name = user.full_name || user.fullName || user.name || 
		             user.firstName || user.first_name || user.username ||
		             user.displayName || user.display_name;
		
		if (name) {
			return name.charAt(0).toUpperCase();
		}
		
		return user.email ? user.email.charAt(0).toUpperCase() : 'A';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 overflow-hidden fixed w-screen">
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
			md:w-[50%] lg:static lg:w-64
			lg:translate-x-0 flex flex-col
		"
		>
			<!-- User Profile -->
			<div class="border-b border-gray-200 p-4 flex-shrink-0">
				{#if loadingUser}
					<div class="flex flex-col items-center justify-center">
						<div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-300 mb-2 animate-pulse">
						</div>
						<div class="text-center">
							<div class="h-3 bg-gray-300 rounded w-16 mb-1 animate-pulse"></div>
							<div class="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center">
						<div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 mb-2">
							<span class="text-sm font-semibold text-white">
								{getInitials(user)}
							</span>
						</div>
						<div class="text-center">
							<p class="text-xs text-gray-500">Agent Dashboard</p>
							<p class="text-sm font-bold text-gray-900 truncate max-w-full">
								{getDisplayName(user)}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Navigation -->
			<nav class="flex-1 overflow-y-auto px-2 py-4">
				<div class="space-y-4">
					<a
						href="/agent"
						class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/agent'
							? 'bg-green-100 text-green-700'
							: 'text-gray-600 hover:bg-gray-100'}"
						on:click={closeSidebar}
					>
						<BarChart3 class="mr-3 h-5 w-5" />
						Dashboard
					</a>

					<a
						href="/agent/properties"
						class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/agent/properties'
							? 'bg-green-100 text-green-700'
							: 'text-gray-600 hover:bg-gray-100'}"
						on:click={closeSidebar}
					>
						<Building2 class="mr-3 h-5 w-5" />
						My Properties
					</a>

					<a
						href="/agent/add-property"
						class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/agent/add-property'
							? 'bg-green-100 text-green-700'
							: 'text-gray-600 hover:bg-gray-100'}"
						on:click={closeSidebar}
					>
						<Plus class="mr-3 h-5 w-5" />
						Add Property
					</a>

					<a
						href="/agent/messages"
						class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/agent/messages'
							? 'bg-green-100 text-green-700'
							: 'text-gray-600 hover:bg-gray-100'}"
						on:click={closeSidebar}
					>
						<MessageSquare class="mr-3 h-5 w-5" />
						Messages
					</a>

					<a
						href="/agent/profile"
						class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/agent/profile'
							? 'bg-green-100 text-green-700'
							: 'text-gray-600 hover:bg-gray-100'}"
						on:click={closeSidebar}
					>
						<User class="mr-3 h-5 w-5" />
						Profile
					</a>
				</div>
			</nav>

			<!-- Logout -->
			<div class="border-t border-gray-200 p-4 flex-shrink-0">
				<button
					on:click={logout}
					class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
				>
					<LogOut class="mr-3 h-5 w-5" />
					Logout
				</button>
			</div>
		</div>

		<!-- Main content -->
		<div class="flex-1 lg:ml-0 flex flex-col min-h-0">
			<!-- Page Content -->
			<div class="flex-1 overflow-y-auto">
				<div class="h-screen">
					<slot />
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Notification and Confirmation Containers -->
<NotificationContainer />
<ConfirmationContainer />
