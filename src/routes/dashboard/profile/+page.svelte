<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthToken, getStoredUser, updateStoredUser } from '$lib/token';
	import { 
		User, 
		Mail, 
		Phone, 
		MapPin, 
		Save, 
		Bell,
		Home,
		Heart,
		MessageSquare,
		Settings,
		Calendar,
		Search,
		LogOut,
		Menu,
		X
	} from 'lucide-svelte';

	let user: any = null;
	let profile = {
		full_name: '',
		email: '',
		phone: '',
		location: '',
		notification_preferences: {
			email_notifications: true,
			sms_notifications: false,
			push_notifications: true,
			property_alerts: true,
			price_updates: false
		},
		search_preferences: {
			preferred_locations: [],
			property_types: [],
			min_budget: null,
			max_budget: null
		}
	};
	let savedProperties: any[] = [];
	let viewingRequests: any[] = [];
	let messages: any[] = [];
	let loading = true;
	let saving = false;
	let error = '';
	let success = '';
	let currentPage = 'profile';
	let sidebarOpen = false;

	const propertyTypes = ['Apartment', 'House', 'Villa', 'Duplex', 'Bungalow', 'Commercial'];
	const locations = ['Lagos Island', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ajah', 'Surulere', 'Ikeja'];

	onMount(() => {
		user = getStoredUser();
		if (!user) {
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
			goto('/login');
			return;
		}

		// Initialize profile with user data immediately
		profile = {
			full_name: user.full_name || user.name || '',
			email: user.email || '',
			phone: user.phone || '',
			location: user.bio || user.location || '',
			notification_preferences: {
				email_notifications: true,
				sms_notifications: false,
				push_notifications: true,
				property_alerts: true,
				price_updates: false
			},
			search_preferences: {
				preferred_locations: [],
				property_types: [],
				min_budget: null,
				max_budget: null
			}
		};

		loadProfile();
		loadDashboardData();
	});

	async function loadProfile() {
		try {
			// Load full profile from API
			const token = getAuthToken();
			if (!token) {
				console.warn('No authentication token found, using localStorage data');
				loading = false;
				return;
			}
			
			console.log('Using token for profile fetch:', token);
			
			const response = await fetch('/api/user/profile', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (!response.ok) {
				console.warn(`Failed to load profile from API: ${response.status}, using localStorage data`);
				loading = false;
				return;
			}
			
			const data = await response.json();
			console.log('Profile load response received:', data);
			
			if (data && data.user) {
				console.log('✅ Valid user data received:', Object.keys(data.user));
				
				// Update profile with data from API, but keep existing values as fallback
				profile = {
					full_name: data.user.full_name || profile.full_name,
					email: data.user.email || profile.email,
					phone: data.user.phone || profile.phone,
					location: data.user.bio || profile.location,
					notification_preferences: data.user.notification_preferences || profile.notification_preferences,
					search_preferences: data.user.search_preferences || profile.search_preferences
				};
			}
		} catch (err) {
			console.error('Profile load error:', err);
			error = 'Failed to load profile from server, using local data';
		} finally {
			loading = false;
		}
	}

	async function loadDashboardData() {
		try {
			savedProperties = [];
			viewingRequests = [];
			messages = [];
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		}
	}

	async function saveProfile() {
		try {
			saving = true;
			error = '';
			success = '';
			
			console.log('🔄 Starting profile save...');
			console.log('Profile data to save:', profile);
			
			const token = getAuthToken();
			if (!token) {
				throw new Error('No authentication token found');
			}
			
			console.log('Using token for profile update:', token.substring(0, 20) + '...');
			
			// Call the API to update the profile
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					full_name: profile.full_name,
					phone: profile.phone,
					bio: profile.location, // Save location to bio field
					notification_preferences: profile.notification_preferences,
					search_preferences: profile.search_preferences
				})
			});
			
			console.log('API response status:', response.status);
			
			if (!response.ok) {
				const errorData = await response.json();
				console.error('API error response:', errorData);
				throw new Error(errorData.error || 'Failed to update profile');
			}
			
			const data = await response.json();
			console.log('Profile update response received:', data);
			
			// Safely check if data.user exists before accessing it
			if (data && typeof data === 'object') {
				console.log('✅ Response data is valid object');
				
				if (data.user) {
					console.log('✅ Response contains user object');
					console.log('User object keys:', Object.keys(data.user));
					
					// Update local user data
					user.full_name = profile.full_name;
					updateStoredUser({ full_name: profile.full_name });
					
					// Optionally refresh profile data from the response to ensure consistency
					profile.full_name = data.user.full_name;
					profile.email = data.user.email;
					profile.phone = data.user.phone || '';
					profile.location = data.user.bio || '';
					
					console.log('✅ Profile data updated from response');
				} else {
					console.warn('⚠️ Response missing user object, using local data');
					// Update local user data even without response user object
					user.full_name = profile.full_name;
					updateStoredUser({ full_name: profile.full_name });
				}
			} else {
				console.error('❌ Invalid response data:', data);
				throw new Error('Invalid response from server');
			}
			
			success = 'Profile updated successfully!';
			console.log('✅ Profile save completed successfully');
			
		} catch (err) {
			console.error('💥 Profile save error:', err);
			console.error('Error details:', {
				message: err.message,
				stack: err.stack,
				name: err.name
			});
			error = err.message || 'Failed to save profile';
		} finally {
			saving = false;
		}
	}

	function toggleLocation(location: string) {
		const index = profile.search_preferences.preferred_locations.indexOf(location);
		if (index > -1) {
			profile.search_preferences.preferred_locations.splice(index, 1);
		} else {
			profile.search_preferences.preferred_locations.push(location);
		}
		profile.search_preferences.preferred_locations = [...profile.search_preferences.preferred_locations];
	}

	function togglePropertyType(type: string) {
		const index = profile.search_preferences.property_types.indexOf(type);
		if (index > -1) {
			profile.search_preferences.property_types.splice(index, 1);
		} else {
			profile.search_preferences.property_types.push(type);
		}
		profile.search_preferences.property_types = [...profile.search_preferences.property_types];
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('houserz_token');
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
	<title>Profile Settings - Houserz</title>
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
					<h1 class="text-xl font-bold text-gray-900 lg:text-2xl">Profile Settings</h1>
					<p class="text-sm text-gray-600 lg:text-base">Manage your account information and preferences</p>
				</div>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
				</div>
			{:else}
				<form on:submit|preventDefault={saveProfile} class="space-y-6 lg:space-y-8">
					{#if success}
						<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm lg:text-base">
							{success}
						</div>
					{/if}

					{#if error}
						<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm lg:text-base">
							{error}
						</div>
					{/if}

					<!-- Personal Information -->
					<div class="bg-white rounded-xl shadow-sm p-4 lg:p-6">
						<h2 class="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Personal Information</h2>
						
						<div class="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2">
							<div>
								<label for="full_name" class="block text-sm font-medium text-gray-700">
									Full Name
								</label>
								<div class="mt-1 relative">
									<input
										id="full_name"
										type="text"
										bind:value={profile.full_name}
										required
										class="appearance-none block w-full px-3 py-2 pl-8 lg:pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
									/>
									<User class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 absolute left-2.5 lg:left-3 top-2.5" />
								</div>
							</div>

							<div>
								<label for="email" class="block text-sm font-medium text-gray-700">
									Email Address
								</label>
								<div class="mt-1 relative">
									<input
										id="email"
										type="email"
										bind:value={profile.email}
										required
										class="appearance-none block w-full px-3 py-2 pl-8 lg:pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
									/>
									<Mail class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 absolute left-2.5 lg:left-3 top-2.5" />
								</div>
							</div>

							<div>
								<label for="phone" class="block text-sm font-medium text-gray-700">
									Phone Number
								</label>
								<div class="mt-1 relative">
									<input
										id="phone"
										type="tel"
										bind:value={profile.phone}
										class="appearance-none block w-full px-3 py-2 pl-8 lg:pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
									/>
									<Phone class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 absolute left-2.5 lg:left-3 top-2.5" />
								</div>
							</div>

							<div>
								<label for="location" class="block text-sm font-medium text-gray-700">
									Current Location
								</label>
								<div class="mt-1 relative">
									<input
										id="location"
										type="text"
										bind:value={profile.location}
										placeholder="e.g., Lagos, Nigeria"
										class="appearance-none block w-full px-3 py-2 pl-8 lg:pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
									/>
									<MapPin class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 absolute left-2.5 lg:left-3 top-2.5" />
								</div>
							</div>
						</div>
					</div>

					<!-- Notification Preferences -->
					<div class="bg-white rounded-xl shadow-sm p-4 lg:p-6 relative opacity-60">
						<div class="absolute top-4 right-4 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
							Coming Soon
						</div>
						<h2 class="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Notification Preferences</h2>
						
						<div class="space-y-3 lg:space-y-4 pointer-events-none">
							<div class="flex items-center justify-between">
								<div class="flex items-center">
									<Bell class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mr-3" />
									<div>
										<label class="text-sm font-medium text-gray-700">Email Notifications</label>
										<p class="text-xs lg:text-sm text-gray-500">Receive updates via email</p>
									</div>
								</div>
								<label class="relative inline-flex items-center cursor-not-allowed">
									<input
										type="checkbox"
										checked={profile.notification_preferences.email_notifications}
										disabled
										class="sr-only peer"
									/>
									<div class="w-9 h-5 lg:w-11 lg:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-green-600"></div>
								</label>
							</div>

							<div class="flex items-center justify-between">
								<div class="flex items-center">
									<Bell class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mr-3" />
									<div>
										<label class="text-sm font-medium text-gray-700">SMS Notifications</label>
										<p class="text-xs lg:text-sm text-gray-500">Receive updates via SMS</p>
									</div>
								</div>
								<label class="relative inline-flex items-center cursor-not-allowed">
									<input
										type="checkbox"
										checked={profile.notification_preferences.sms_notifications}
										disabled
										class="sr-only peer"
									/>
									<div class="w-9 h-5 lg:w-11 lg:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-green-600"></div>
								</label>
							</div>

							<div class="flex items-center justify-between">
								<div class="flex items-center">
									<Bell class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mr-3" />
									<div>
										<label class="text-sm font-medium text-gray-700">Property Alerts</label>
										<p class="text-xs lg:text-sm text-gray-500">Get notified about new matching properties</p>
									</div>
								</div>
								<label class="relative inline-flex items-center cursor-not-allowed">
									<input
										type="checkbox"
										checked={profile.notification_preferences.property_alerts}
										disabled
										class="sr-only peer"
									/>
									<div class="w-9 h-5 lg:w-11 lg:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-green-600"></div>
								</label>
							</div>

							<div class="flex items-center justify-between">
								<div class="flex items-center">
									<Bell class="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mr-3" />
									<div>
										<label class="text-sm font-medium text-gray-700">Price Updates</label>
										<p class="text-xs lg:text-sm text-gray-500">Get notified about price changes on saved properties</p>
									</div>
								</div>
								<label class="relative inline-flex items-center cursor-not-allowed">
									<input
										type="checkbox"
										checked={profile.notification_preferences.price_updates}
										disabled
										class="sr-only peer"
									/>
									<div class="w-9 h-5 lg:w-11 lg:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-green-600"></div>
								</label>
							</div>
						</div>
					</div>

					<!-- Search Preferences -->
					<div class="bg-white rounded-xl shadow-sm p-4 lg:p-6 relative opacity-60">
						<div class="absolute top-4 right-4 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
							Coming Soon
						</div>
						<h2 class="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Search Preferences</h2>
						
						<div class="space-y-4 lg:space-y-6 pointer-events-none">
							<!-- Preferred Locations -->
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-3">
									Preferred Locations
								</label>
								<div class="flex flex-wrap gap-2">
									{#each locations as location}
										<button
											type="button"
											disabled
											class="px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm border cursor-not-allowed {
												profile.search_preferences.preferred_locations.includes(location)
													? 'bg-green-100 border-green-300 text-green-800'
													: 'bg-gray-100 border-gray-300 text-gray-700'
											}"
										>
											{location}
										</button>
									{/each}
								</div>
							</div>

							<!-- Property Types -->
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-3">
									Property Types
								</label>
								<div class="flex flex-wrap gap-2">
									{#each propertyTypes as type}
										<button
											type="button"
											disabled
											class="px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm border cursor-not-allowed {
												profile.search_preferences.property_types.includes(type)
													? 'bg-green-100 border-green-300 text-green-800'
													: 'bg-gray-100 border-gray-300 text-gray-700'
											}"
										>
											{type}
										</button>
									{/each}
								</div>
							</div>

							<!-- Budget Range -->
							<div class="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2">
								<div>
									<label for="min_budget" class="block text-sm font-medium text-gray-700">
										Minimum Budget (₦)
									</label>
									<input
										id="min_budget"
										type="number"
										value={profile.search_preferences.min_budget}
										placeholder="e.g., 50000000"
										disabled
										class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base bg-gray-50 cursor-not-allowed"
									/>
								</div>

								<div>
									<label for="max_budget" class="block text-sm font-medium text-gray-700">
										Maximum Budget (₦)
									</label>
									<input
										id="max_budget"
										type="number"
										value={profile.search_preferences.max_budget}
										placeholder="e.g., 200000000"
										disabled
										class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base bg-gray-50 cursor-not-allowed"
									/>
								</div>
							</div>
						</div>
					</div>

					<!-- Save Button -->
					<div class="flex justify-end">
						<button
							type="submit"
							disabled={saving}
							class="inline-flex items-center px-4 lg:px-6 py-2 lg:py-3 border border-transparent text-sm lg:text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
						>
							{#if saving}
								<div class="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white mr-2"></div>
								Saving...
							{:else}
								<Save class="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
								Save Changes
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
