<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthToken, getStoredUser, updateStoredUser } from '$lib/token';
	import { User, Mail, Phone, FileText, Save, Calendar, Clock, Shield, Award } from 'lucide-svelte';

	interface AdminProfile {
		id?: number;
		full_name: string;
		email: string;
		phone: string;
		profile_image?: string;
		bio: string;
		role: string;
		is_verified: boolean;
		created_at?: string;
		last_seen?: string;
		activity_stats?: {
			properties_approved: number;
			agents_verified: number;
			users_managed: number;
			total_activities: number;
		};
	}

	let user: any = null;
	let profile: AdminProfile = {
		full_name: '',
		email: '',
		phone: '',
		bio: '',
		role: 'ADMIN',
		is_verified: true
	};
	let loading = true;
	let saving = false;
	let error = '';
	let success = '';

	onMount(() => {
		// Get user data from localStorage using utility function
		user = getStoredUser();
		if (!user) {
			goto('/login');
			return;
		}

		if (user.role !== 'admin' && user.role !== 'ADMIN') {
			goto('/');
			return;
		}

		loadProfile();
	});

	async function loadProfile() {
		try {
			loading = true;
			error = '';
			
			// Get token from localStorage - check both possible token keys
			const token = localStorage.getItem('token') || localStorage.getItem('houserz_token');
			if (!token) {
				throw new Error('No authentication token found');
			}
			
			console.log('Using token for admin profile fetch:', token);
			
			// Fetch profile data from API
			const response = await fetch('/api/admin/profile', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (!response.ok) {
				throw new Error(`Failed to load profile: ${response.status}`);
			}
			
			const data = await response.json();
			
			if (data.success && data.profile) {
				profile = data.profile;
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
			if (!profile.full_name) {
				error = 'Full name is required';
				return;
			}
			
			// Get token from localStorage - check both possible token keys
			const token = localStorage.getItem('token') || localStorage.getItem('houserz_token');
			if (!token) {
				throw new Error('No authentication token found');
			}
			
			console.log('Using token for admin profile update:', token);
			
			// Send data to API
			const response = await fetch('/api/admin/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(profile)
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save profile');
			}
			
			const data = await response.json();
			
			// Update profile with returned data
			if (data.profile) {
				profile = { ...profile, ...data.profile };
			}
			
			// Update user in localStorage
			if (user) {
				user.full_name = profile.full_name;
				localStorage.setItem('user', JSON.stringify(user));
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
	<title>Admin Profile - Houserz</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-4 lg:p-6">
	<!-- Header -->
	<div class="mb-6 lg:mb-8">
		<h1 class="text-2xl lg:text-3xl font-bold text-gray-900">Admin Profile</h1>
		<p class="mt-2 text-gray-600">Manage your administrator account information</p>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
			<!-- Profile Form -->
			<div class="lg:col-span-2">
				<form on:submit|preventDefault={saveProfile} class="space-y-6">
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
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
							<div>
								<label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">
									Full Name *
								</label>
								<div class="relative">
									<input
										id="fullName"
										type="text"
										bind:value={profile.full_name}
										required
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
										readonly
										class="w-full pl-10 pr-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
									/>
									<Mail class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
								<p class="mt-1 text-xs text-gray-500">Email cannot be changed</p>
							</div>

							<div>
								<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
									Phone Number
								</label>
								<div class="relative">
									<input
										id="phone"
										type="tel"
										bind:value={profile.phone}
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
										placeholder="+234 801 234 5678"
									/>
									<Phone class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
							</div>

							<div>
								<label for="profileImage" class="block text-sm font-medium text-gray-700 mb-2">
									Profile Image URL
								</label>
								<div class="relative">
									<input
										id="profileImage"
										type="text"
										bind:value={profile.profile_image}
										class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
										placeholder="https://example.com/image.jpg"
									/>
									<FileText class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								</div>
							</div>

							<div class="md:col-span-2">
								<label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
									Bio / About
								</label>
								<textarea
									id="bio"
									bind:value={profile.bio}
									rows="4"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
									placeholder="Write a brief description about yourself as an administrator..."
								></textarea>
							</div>
						</div>
					</div>

					<!-- Save Button -->
					<div class="flex justify-end">
						<button
							type="submit"
							disabled={saving}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
						>
							{#if saving}
								<div class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								Saving...
							{:else}
								<Save class="h-4 w-4 mr-2" />
								Save Changes
							{/if}
						</button>
					</div>
				</form>
			</div>

			<!-- Admin Information Panel -->
			<div>
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
					<div class="flex items-center space-x-4 mb-6">
						<div class="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
							{profile.full_name ? profile.full_name[0].toUpperCase() : 'A'}
						</div>
						<div>
							<h3 class="text-lg font-medium text-gray-900">{profile.full_name || 'Admin'}</h3>
							<p class="text-sm text-gray-500 flex items-center">
								<Shield class="h-4 w-4 mr-1" />
								{profile.role}
							</p>
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center space-x-2 text-sm">
							<Calendar class="h-4 w-4 text-gray-400" />
							<span class="text-gray-500">Account created:</span>
							<span class="text-gray-900 font-medium">
								{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
							</span>
						</div>

						<div class="flex items-center space-x-2 text-sm">
							<Clock class="h-4 w-4 text-gray-400" />
							<span class="text-gray-500">Last active:</span>
							<span class="text-gray-900 font-medium">
								{profile.last_seen ? new Date(profile.last_seen).toLocaleDateString() : 'N/A'}
							</span>
						</div>
					</div>

					<!-- Admin Stats -->
					{#if profile.activity_stats}
						<div class="mt-6 pt-6 border-t border-gray-200">
							<h3 class="text-sm font-medium text-gray-900 mb-4 flex items-center">
								<Award class="h-4 w-4 mr-2 text-indigo-500" />
								Activity Statistics
							</h3>
							
							<div class="grid grid-cols-2 gap-4">
								<div class="bg-gray-50 p-3 rounded-lg">
									<p class="text-xs text-gray-500">Properties Approved</p>
									<p class="text-lg font-semibold text-indigo-600">
										{profile.activity_stats.properties_approved}
									</p>
								</div>
								
								<div class="bg-gray-50 p-3 rounded-lg">
									<p class="text-xs text-gray-500">Agents Verified</p>
									<p class="text-lg font-semibold text-indigo-600">
										{profile.activity_stats.agents_verified}
									</p>
								</div>
								
								<div class="bg-gray-50 p-3 rounded-lg">
									<p class="text-xs text-gray-500">Users Managed</p>
									<p class="text-lg font-semibold text-indigo-600">
										{profile.activity_stats.users_managed}
									</p>
								</div>
								
								<div class="bg-gray-50 p-3 rounded-lg">
									<p class="text-xs text-gray-500">Total Activities</p>
									<p class="text-lg font-semibold text-indigo-600">
										{profile.activity_stats.total_activities}
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
