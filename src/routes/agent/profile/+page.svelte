<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthToken, getStoredUser, updateStoredUser } from '$lib/token';
	import { User, Mail, Phone, MapPin, Save, Lock } from 'lucide-svelte';

	interface BasicProfile {
		id?: number;
		full_name: string;
		email: string;
		phone: string;
		current_location: string;
	}

	let user: any = null;
	let profile: BasicProfile = {
		full_name: '',
		email: '',
		phone: '',
		current_location: ''
	};
	let loading = true;
	let saving = false;
	let error = '';
	let success = '';

	onMount(() => {
		// Get user data from localStorage (authentication handled by layout)
		user = getStoredUser();
		if (!user) {
			goto('/login');
			return;
		}
		
		if (user.role !== 'agent' && user.role !== 'AGENT') {
			goto('/');
			return;
		}

		loadProfile();
	});

	async function loadProfile() {
		try {
			loading = true;
			error = '';
			
			// Get token using utility function
			const token = getAuthToken();
			if (!token) {
				throw new Error('No authentication token found');
			}
			
			console.log('Using token for agent profile fetch:', token);
			
			// Fetch profile data from API
			const response = await fetch('/api/user/profile', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (!response.ok) {
				throw new Error(`Failed to load profile: ${response.status}`);
			}
			
			const data = await response.json();
			
			if (data.user) {
				// Map user data to profile structure
				profile = {
					id: data.user.id,
					full_name: data.user.fullName || data.user.full_name || '',
					email: data.user.email || '',
					phone: data.user.phone || '',
					current_location: data.user.bio || '' // Using bio field for location
				};
			}
		} catch (err) {
			console.error('Failed to load profile:', err);
			error = err.message || 'Failed to load profile';
		} finally {
			loading = false;
		}
	}

	async function saveProfile() {
		try {
			saving = true;
			error = '';
			success = '';

			// Validate required fields
			if (!profile.full_name || !profile.email || !profile.phone || !profile.current_location) {
				error = 'Please fill in all required fields';
				return;
			}
			
			// Get token using utility function
			const token = getAuthToken();
			if (!token) {
				throw new Error('No authentication token found');
			}
			
			console.log('Using token for agent profile update:', token);
			
			// Send data to API
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					fullName: profile.full_name,
					phone: profile.phone,
					bio: profile.current_location // Save location to bio field
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save profile');
			}
			
			const data = await response.json();
			
			// Update profile with returned data if needed
			if (data.user) {
				profile.full_name = data.user.fullName || data.user.full_name;
				profile.email = data.user.email;
				profile.phone = data.user.phone;
				profile.current_location = data.user.bio || '';
				
				// Update stored user data
				updateStoredUser({
					...user,
					fullName: profile.full_name,
					full_name: profile.full_name,
					phone: profile.phone,
					bio: profile.current_location
				});
			}
			
			success = 'Profile updated successfully!';
		} catch (err) {
			console.error('Profile save error:', err);
			error = err.message || 'Failed to save profile';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Agent Profile - Houserz</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-4 lg:p-6 pt-5 lg:pt-4">
	<!-- Header -->
	<div class="mb-6 lg:mb-8">
		<h1 class="text-2xl lg:text-3xl font-bold text-gray-900 ml-12 lg:ml-0">Agent Profile</h1>
		<p class="mt-2 text-gray-600">Manage your basic contact information</p>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
			<!-- Profile Form -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Success/Error Messages -->
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
						{error}
					</div>
				{/if}

				{#if success}
					<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
						{success}
					</div>
				{/if}

				<!-- Basic Information -->
				<form on:submit|preventDefault={saveProfile}>
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
							<div class="md:col-span-2">
								<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
									Full Name *
								</label>
								<div class="relative">
									<input
										id="name"
										type="text"
										bind:value={profile.full_name}
										required
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
										placeholder="Enter your full name"
									/>
									<User class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
							</div>

							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
									Email Address *
								</label>
								<div class="relative">
									<input
										id="email"
										type="email"
										bind:value={profile.email}
										disabled
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
										placeholder="your@email.com"
									/>
									<Mail class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
								<p class="mt-1 text-xs text-gray-500">Email cannot be changed from this page</p>
							</div>

							<div>
								<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
									Phone Number *
								</label>
								<div class="relative">
									<input
										id="phone"
										type="tel"
										bind:value={profile.phone}
										required
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
										placeholder="+234 801 234 5678"
									/>
									<Phone class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
							</div>

							<div class="md:col-span-2">
								<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
									Current Location *
								</label>
								<div class="relative">
									<input
										id="location"
										type="text"
										bind:value={profile.current_location}
										required
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
										placeholder="e.g., Lagos, Nigeria"
									/>
									<MapPin class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
							</div>
						</div>

						<!-- Submit Button -->
						<div class="flex justify-end mt-6">
							<button
								type="submit"
								disabled={saving}
								class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
							>
								{#if saving}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Saving...
								{:else}
									<Save class="w-4 h-4 mr-2" />
									Save Changes
								{/if}
							</button>
						</div>
					</div>
				</form>

				<!-- Coming Soon Sections -->
				<div class="space-y-6">
					<!-- Professional Details -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 relative overflow-hidden">
						<div class="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
							<div class="text-center z-10">
								<Lock class="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p class="text-sm font-medium text-gray-600">Coming Soon</p>
							</div>
						</div>
						<h2 class="text-lg font-semibold text-gray-400 mb-4">Professional Details</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 opacity-50">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">License Number</label>
								<input type="text" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" placeholder="REA/LS/2024/000000" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
								<input type="number" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" placeholder="5" />
							</div>
						</div>
					</div>

					<!-- Specializations -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 relative overflow-hidden">
						<div class="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
							<div class="text-center z-10">
								<Lock class="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p class="text-sm font-medium text-gray-600">Coming Soon</p>
							</div>
						</div>
						<h2 class="text-lg font-semibold text-gray-400 mb-4">Specializations</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-50">
							{#each ['Residential Sales', 'Residential Rentals', 'Commercial Properties', 'Land Sales'] as spec}
								<label class="flex items-center">
									<input type="checkbox" disabled class="rounded border-gray-300 text-green-600" />
									<span class="ml-2 text-sm text-gray-700">{spec}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Professional Bio -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 relative overflow-hidden">
						<div class="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
							<div class="text-center z-10">
								<Lock class="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p class="text-sm font-medium text-gray-600">Coming Soon</p>
							</div>
						</div>
						<h2 class="text-lg font-semibold text-gray-400 mb-4">Professional Bio</h2>
						<textarea
							disabled
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 opacity-50"
							placeholder="Tell potential clients about your experience and expertise..."
						></textarea>
					</div>

					<!-- Profile Picture -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 relative overflow-hidden">
						<div class="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
							<div class="text-center z-10">
								<Lock class="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p class="text-sm font-medium text-gray-600">Coming Soon</p>
							</div>
						</div>
						<h2 class="text-lg font-semibold text-gray-400 mb-4">Profile Picture</h2>
						<div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 opacity-50">
							<div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
								<User class="w-12 h-12 text-gray-400" />
							</div>
							<div>
								<button type="button" disabled class="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
									Upload Photo
								</button>
								<p class="mt-2 text-sm text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Profile Summary -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 sticky top-4">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
					
					<div class="space-y-4">
						<!-- Profile Completion -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Basic Info Complete</span>
								<span class="text-sm text-gray-500">
									{#if profile.full_name && profile.email && profile.phone && profile.current_location}
										100%
									{:else}
										{Math.round((
											(profile.full_name ? 1 : 0) +
											(profile.email ? 1 : 0) +
											(profile.phone ? 1 : 0) +
											(profile.current_location ? 1 : 0)
										) / 4 * 100)}%
									{/if}
								</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-green-600 h-2 rounded-full transition-all duration-300" 
									style="width: {Math.round((
										(profile.full_name ? 1 : 0) +
										(profile.email ? 1 : 0) +
										(profile.phone ? 1 : 0) +
										(profile.current_location ? 1 : 0)
									) / 4 * 100)}%"
								></div>
							</div>
						</div>

						<!-- Requirements Checklist -->
						<div class="space-y-2">
							<h4 class="font-medium text-gray-900">Basic Requirements:</h4>
							<div class="space-y-1 text-sm">
								<div class="flex items-center">
									<div class="w-2 h-2 rounded-full {profile.full_name ? 'bg-green-500' : 'bg-gray-300'} mr-2"></div>
									Full Name
								</div>
								<div class="flex items-center">
									<div class="w-2 h-2 rounded-full {profile.email ? 'bg-green-500' : 'bg-gray-300'} mr-2"></div>
									Email Address
								</div>
								<div class="flex items-center">
									<div class="w-2 h-2 rounded-full {profile.phone ? 'bg-green-500' : 'bg-gray-300'} mr-2"></div>
									Phone Number
								</div>
								<div class="flex items-center">
									<div class="w-2 h-2 rounded-full {profile.current_location ? 'bg-green-500' : 'bg-gray-300'} mr-2"></div>
									Current Location
								</div>
							</div>
						</div>

						<!-- Coming Soon Notice -->
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 class="font-medium text-blue-900 mb-2">More Features Coming Soon!</h4>
							<ul class="text-sm text-blue-700 space-y-1">
								<li>• Professional certification</li>
								<li>• Specialization areas</li>
								<li>• Professional bio</li>
								<li>• Profile photo upload</li>
								<li>• Social media links</li>
							</ul>
						</div>

						<!-- Support -->
						<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
							<h4 class="font-medium text-gray-900 mb-2">Need Help?</h4>
							<p class="text-sm text-gray-600 mb-3">
								Contact our support team if you have any questions about your profile.
							</p>
							<button class="text-sm text-green-600 hover:text-green-700 font-medium">
								Contact Support →
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
