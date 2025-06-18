<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Building2,
		Calendar,
		MessageSquare,
		Settings,
		User,
		LogOut,
		Menu,
		X,
		Plus,
		Eye
	} from 'lucide-svelte';

	export let currentPath = '';
	
	let user: any = null;
	let sidebarOpen = false;

	onMount(() => {
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (!userData || !token) {
			goto('/login');
			return;
		}
		
		if (userData) {
			user = JSON.parse(userData);
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

	function isActive(path: string) {
		return currentPath === path || currentPath.startsWith(path + '/');
	}
</script>

<div class="min-h-screen bg-gray-50">
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
			<div class="bg-opacity-50 fixed inset-0 z-30 bg-black lg:hidden" on:click={closeSidebar}></div>
		{/if}

		<!-- Sidebar -->
		<div class="
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
			fixed z-40 h-full w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out
			lg:static lg:translate-x-0
		">
			<div class="flex h-screen flex-col justify-between py-4">
				<div class="flex h-full flex-col justify-between">
					<div>
						<!-- User Profile -->
						<div class="border-b border-gray-200 p-4">
							<div class="flex items-center space-x-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
									<span class="text-sm font-semibold text-white">
										{(user?.fullName || user?.email || 'A').charAt(0)?.toUpperCase()}
									</span>
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-gray-900">
										{user?.fullName || user?.email || 'Agent'}
									</p>
									<p class="truncate text-xs text-gray-500">Real Estate Agent</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Navigation -->
					<nav class="flex-1 space-y-1 px-2 py-4">
						<a
							href="/agent"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {isActive('/agent') && currentPath === '/agent' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Building2 class="mr-3 h-5 w-5" />
							Dashboard
						</a>

						<a
							href="/agent/properties"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {isActive('/agent/properties') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Building2 class="mr-3 h-5 w-5" />
							Properties
						</a>

						<a
							href="/agent/viewings"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {isActive('/agent/viewings') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Calendar class="mr-3 h-5 w-5" />
							Viewings
						</a>

						<a
							href="/agent/messages"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {isActive('/agent/messages') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<MessageSquare class="mr-3 h-5 w-5" />
							Messages
						</a>

						<a
							href="/agent/analytics"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {isActive('/agent/analytics') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Eye class="mr-3 h-5 w-5" />
							Analytics
						</a>

						<a
							href="/agent/settings"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {isActive('/agent/settings') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={closeSidebar}
						>
							<Settings class="mr-3 h-5 w-5" />
							Settings
						</a>

						<a
							href="/agent/add-property"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200"
							on:click={closeSidebar}
						>
							<Plus class="mr-3 h-5 w-5" />
							Add Property
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
		<div class="flex-1 flex flex-col min-h-0 lg:ml-0">
			<main class="flex-1 overflow-y-auto p-6">
				<slot />
			</main>
		</div>
	</div>
</div>
