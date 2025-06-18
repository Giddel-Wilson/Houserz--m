<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Bell, Menu, X, User, LogOut } from 'lucide-svelte';

	export let currentPage = '';
	
	let user: any = null;
	let mobileMenuOpen = false;

	onMount(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		}
	});

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		goto('/');
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="/" class="text-2xl font-bold text-blue-600">Houserz</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-8">
				<a 
					href="/" 
					class="text-gray-600 hover:text-blue-600 transition-colors {currentPage === 'home' ? 'text-blue-600 font-medium' : ''}"
				>
					Home
				</a>
				<a 
					href="{user?.role === 'buyer' ? '/dashboard/properties' : '/properties'}" 
					class="text-gray-600 hover:text-blue-600 transition-colors {currentPage === 'properties' ? 'text-blue-600 font-medium' : ''}"
				>
					Properties
				</a>
				{#if user?.role === 'buyer'}
					<a 
						href="/dashboard" 
						class="text-gray-600 hover:text-blue-600 transition-colors {currentPage === 'dashboard' ? 'text-blue-600 font-medium' : ''}"
					>
						Dashboard
					</a>
				{/if}
				{#if user?.role === 'agent'}
					<a 
						href="/agent" 
						class="text-gray-600 hover:text-blue-600 transition-colors {currentPage === 'agent' ? 'text-blue-600 font-medium' : ''}"
					>
						Agent Portal
					</a>
				{/if}
				{#if user?.role === 'admin'}
					<a 
						href="/admin" 
						class="text-gray-600 hover:text-blue-600 transition-colors {currentPage === 'admin' ? 'text-blue-600 font-medium' : ''}"
					>
						Admin Panel
					</a>
				{/if}
			</div>

			<!-- Desktop User Menu -->
			<div class="hidden md:flex items-center space-x-4">
				{#if user}
					<button class="p-2 text-gray-400 hover:text-gray-600 relative">
						<Bell class="w-5 h-5" />
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
					</button>
					
					<!-- User Dropdown -->
					<div class="relative group">
						<button class="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none">
							<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<User class="w-4 h-4 text-blue-600" />
							</div>
							<span class="text-sm font-medium">{user.name}</span>
						</button>
						
						<!-- Dropdown Menu -->
						<div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
							<div class="py-1">
								{#if user.role === 'buyer'}
									<a href="/dashboard/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
										Profile Settings
									</a>
									<a href="/dashboard/favorites" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
										My Favorites
									</a>
								{:else if user.role === 'agent'}
									<a href="/agent/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
										Agent Profile
									</a>
									<a href="/agent/properties" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
										My Properties
									</a>
								{/if}
								<div class="border-t border-gray-200"></div>
								<button 
									on:click={logout}
									class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
								>
									<LogOut class="w-4 h-4 inline mr-2" />
									Logout
								</button>
							</div>
						</div>
					</div>
				{:else}
					<a href="/login" class="text-gray-600 hover:text-blue-600 transition-colors">
						Sign In
					</a>
					<a href="/register" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
						Get Started
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<div class="md:hidden">
				<button 
					on:click={toggleMobileMenu}
					class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
				>
					{#if mobileMenuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-gray-200 bg-white">
				<div class="px-2 pt-2 pb-3 space-y-1">
					<a 
						href="/" 
						on:click={closeMobileMenu}
						class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors {currentPage === 'home' ? 'text-blue-600 bg-blue-50' : ''}"
					>
						Home
					</a>
					<a 
						href="{user?.role === 'buyer' ? '/dashboard/properties' : '/properties'}" 
						on:click={closeMobileMenu}
						class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors {currentPage === 'properties' ? 'text-blue-600 bg-blue-50' : ''}"
					>
						Properties
					</a>
					
					{#if user}
						{#if user.role === 'buyer'}
							<a 
								href="/dashboard" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors {currentPage === 'dashboard' ? 'text-blue-600 bg-blue-50' : ''}"
							>
								Dashboard
							</a>
							<a 
								href="/dashboard/favorites" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
							>
								My Favorites
							</a>
							<a 
								href="/dashboard/profile" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
							>
								Profile Settings
							</a>
						{:else if user.role === 'agent'}
							<a 
								href="/agent" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors {currentPage === 'agent' ? 'text-blue-600 bg-blue-50' : ''}"
							>
								Agent Portal
							</a>
							<a 
								href="/agent/properties" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
							>
								My Properties
							</a>
							<a 
								href="/agent/profile" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
							>
								Agent Profile
							</a>
						{:else if user.role === 'admin'}
							<a 
								href="/admin" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors {currentPage === 'admin' ? 'text-blue-600 bg-blue-50' : ''}"
							>
								Admin Panel
							</a>
						{/if}
						
						<div class="border-t border-gray-200 my-2"></div>
						
						<!-- User Info -->
						<div class="px-3 py-2">
							<div class="flex items-center space-x-3">
								<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
									<User class="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<p class="text-sm font-medium text-gray-900">{user.name}</p>
									<p class="text-xs text-gray-500">{user.email}</p>
								</div>
							</div>
						</div>
						
						<button 
							on:click={() => { logout(); closeMobileMenu(); }}
							class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
						>
							<LogOut class="w-4 h-4 inline mr-2" />
							Logout
						</button>
					{:else}
						<a 
							href="/login" 
							on:click={closeMobileMenu}
							class="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
						>
							Sign In
						</a>
						<a 
							href="/register" 
							on:click={closeMobileMenu}
							class="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-center"
						>
							Get Started
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</nav>

<style>
	/* Smooth dropdown animations */
	.group:hover .group-hover\:opacity-100 {
		transition-delay: 100ms;
	}
</style>
