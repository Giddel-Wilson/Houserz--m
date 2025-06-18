<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { 
		Users, 
		Shield, 
		Building2, 
		MessageSquare, 
		Settings, 
		LogOut,
		Menu,
		X,
		Bell,
		Activity
	} from 'lucide-svelte';

	let user: any = null;
	let sidebarOpen = false;

	onMount(() => {
		// Check if user is authenticated and is an admin
		const userData = localStorage.getItem('user');
		if (!userData) {
			goto('/login');
			return;
		}
		
		user = JSON.parse(userData);
		// Check for both uppercase and lowercase admin role
		if (user.role !== 'admin' && user.role !== 'ADMIN') {
			goto('/');
			return;
		}
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
</script>

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
			md:w-[50%] lg:static lg:w-64
			lg:translate-x-0 lg:h-screen
		"
		>
			<div class="flex h-full flex-col justify-between py-4">
				<div class="flex h-full flex-col justify-between">
					<div>
						<!-- User Profile -->
						<div class="border-b border-gray-200 p-4">
							<div class="flex flex-col items-center justify-center space-x-3">
								<div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-500">
									<span class="flex justify-center text-sm font-semibold text-white">
										{(user?.fullName || user?.name || 'A').charAt(0)?.toUpperCase()}
									</span>
								</div>
								<div class="min-w-0 flex-1 flex-col justify-center">
									<p class="flex justify-center truncate text-xs text-gray-500">Admin Panel</p>
									<p
										class="flex justify-center truncate text-sm font-bold text-gray-900 md:text-base"
									>
										{user?.fullName || user?.name || 'Administrator'}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Navigation -->
					<nav class="flex-1 overflow-y-auto space-y-1 px-2 py-4 flex flex-col space-y-4">
						<a
							href="/admin"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/admin'
								? 'bg-red-100 text-red-700'
								: 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Shield class="mr-3 h-5 w-5" />
							Dashboard
						</a>

						<a
							href="/admin/users"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/admin/users'
								? 'bg-red-100 text-red-700'
								: 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Users class="mr-3 h-5 w-5" />
							User Management
						</a>

						<a
							href="/admin/properties"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/admin/properties'
								? 'bg-red-100 text-red-700'
								: 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Building2 class="mr-3 h-5 w-5" />
							Properties
						</a>

						<a
							href="/admin/messages"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/admin/messages'
								? 'bg-red-100 text-red-700'
								: 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<MessageSquare class="mr-3 h-5 w-5" />
							Messages
						</a>

						<a
							href="/admin/settings"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {$page.url.pathname === '/admin/settings'
								? 'bg-red-100 text-red-700'
								: 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Settings class="mr-3 h-5 w-5" />
							Settings
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

		<!-- Main content -->
		<div class="flex-1 lg:ml-0 flex flex-col h-screen overflow-hidden">
			<!-- Top Bar -->
			<div class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
				<div class="flex items-center justify-between px-4 py-3 lg:px-6">
					<div class="flex items-center">
						<h1 class="text-lg font-semibold text-gray-900 lg:text-xl ml-12 lg:ml-auto mt-3 lg:mt-0">Houserz Admin</h1>
					</div>
					<div class="flex items-center space-x-3">
						<button class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
							<Bell class="h-5 w-5" />
						</button>
						<div class="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
							<span class="text-sm font-medium text-white">
								{(user?.fullName || user?.name || 'A').charAt(0)?.toUpperCase()}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Page Content - Scrollable -->
			<div class="flex-1 overflow-y-auto p-4 lg:p-6">
				<slot />
			</div>
		</div>
	</div>
</div>
