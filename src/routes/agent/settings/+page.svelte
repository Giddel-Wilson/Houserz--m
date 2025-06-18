<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Bell, 
		Lock, 
		Globe, 
		Smartphone, 
		Mail, 
		Eye, 
		EyeOff,
		Save,
		Shield,
		Trash2
	} from 'lucide-svelte';

	let user: any = null;
	let settings = {
		notifications: {
			email: true,
			push: true,
			sms: false,
			newMessages: true,
			propertyViews: true,
			viewingRequests: true,
			systemUpdates: false
		},
		privacy: {
			showOnlineStatus: true,
			showLastSeen: true,
			allowDirectMessages: true,
			showProfile: true
		},
		account: {
			twoFactorEnabled: false,
			sessionTimeout: 30
		}
	};
	
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let saving = false;
	let passwordChanging = false;
	let showCurrentPassword = false;
	let showNewPassword = false;
	let showConfirmPassword = false;
	let success = '';
	let error = '';

	onMount(() => {
		// Get user data from localStorage (authentication handled by layout)
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		}
		
		loadSettings();
	});

	async function loadSettings() {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/agent/settings', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				settings = { ...settings, ...data.settings };
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}

	async function saveSettings() {
		try {
			saving = true;
			error = '';
			success = '';
			
			const token = localStorage.getItem('token');
			const response = await fetch('/api/agent/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ settings })
			});
			
			if (response.ok) {
				success = 'Settings saved successfully!';
				setTimeout(() => success = '', 3000);
			} else {
				const data = await response.json();
				error = data.error || 'Failed to save settings';
			}
		} catch (err) {
			error = 'Error saving settings';
		} finally {
			saving = false;
		}
	}

	async function changePassword() {
		if (newPassword !== confirmPassword) {
			error = 'New passwords do not match';
			return;
		}
		
		if (newPassword.length < 8) {
			error = 'Password must be at least 8 characters long';
			return;
		}
		
		try {
			passwordChanging = true;
			error = '';
			success = '';
			
			const token = localStorage.getItem('token');
			const response = await fetch('/api/user/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					currentPassword,
					newPassword
				})
			});
			
			if (response.ok) {
				success = 'Password changed successfully!';
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
				setTimeout(() => success = '', 3000);
			} else {
				const data = await response.json();
				error = data.error || 'Failed to change password';
			}
		} catch (err) {
			error = 'Error changing password';
		} finally {
			passwordChanging = false;
		}
	}

	async function deleteAccount() {
		if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			return;
		}
		
		if (!confirm('This will permanently delete all your properties, messages, and data. Are you absolutely sure?')) {
			return;
		}
		
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/user/delete-account', {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				goto('/');
			} else {
				const data = await response.json();
				error = data.error || 'Failed to delete account';
			}
		} catch (err) {
			error = 'Error deleting account';
		}
	}
</script>

<svelte:head>
	<title>Settings - Houserz Agent</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-5">
	<div class="mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 ml-12 lg:ml-0">Settings</h1>
			<p class="mt-2 text-gray-600">Manage your account preferences and security settings</p>
		</div>

		<!-- Success/Error Messages -->
		{#if success}
			<div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
				<p class="text-green-700">{success}</p>
			</div>
		{/if}

		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
				<p class="text-red-700">{error}</p>
			</div>
		{/if}

		<div class="space-y-8">
			<!-- Notifications -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex items-center">
						<Bell class="h-5 w-5 text-gray-400 mr-2" />
						<h2 class="text-lg font-medium text-gray-900">Notification Preferences</h2>
					</div>
				</div>
				<div class="px-6 py-4 space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Email Notifications</p>
							<p class="text-sm text-gray-500">Receive notifications via email</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.notifications.email}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Push Notifications</p>
							<p class="text-sm text-gray-500">Receive push notifications in browser</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.notifications.push}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">New Messages</p>
							<p class="text-sm text-gray-500">Get notified when you receive new messages</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.notifications.newMessages}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Property Views</p>
							<p class="text-sm text-gray-500">Get notified when someone views your properties</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.notifications.propertyViews}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Viewing Requests</p>
							<p class="text-sm text-gray-500">Get notified of new viewing requests</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.notifications.viewingRequests}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
				</div>
			</div>

			<!-- Privacy -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex items-center">
						<Eye class="h-5 w-5 text-gray-400 mr-2" />
						<h2 class="text-lg font-medium text-gray-900">Privacy Settings</h2>
					</div>
				</div>
				<div class="px-6 py-4 space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Show Online Status</p>
							<p class="text-sm text-gray-500">Let others see when you're online</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.privacy.showOnlineStatus}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Show Last Seen</p>
							<p class="text-sm text-gray-500">Show when you were last active</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.privacy.showLastSeen}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Allow Direct Messages</p>
							<p class="text-sm text-gray-500">Allow users to send you direct messages</p>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.privacy.allowDirectMessages}
							class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
						/>
					</div>
				</div>
			</div>

			<!-- Security -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex items-center">
						<Shield class="h-5 w-5 text-gray-400 mr-2" />
						<h2 class="text-lg font-medium text-gray-900">Security</h2>
					</div>
				</div>
				<div class="px-6 py-4 space-y-6">
					<!-- Change Password -->
					<div>
						<h3 class="text-base font-medium text-gray-900 mb-4">Change Password</h3>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Current Password
								</label>
								<div class="relative">
									<input
										type={showCurrentPassword ? 'text' : 'password'}
										bind:value={currentPassword}
										class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
									/>
									<button
										type="button"
										on:click={() => showCurrentPassword = !showCurrentPassword}
										class="absolute inset-y-0 right-0 pr-3 flex items-center"
									>
										{#if showCurrentPassword}
											<EyeOff class="h-4 w-4 text-gray-400" />
										{:else}
											<Eye class="h-4 w-4 text-gray-400" />
										{/if}
									</button>
								</div>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									New Password
								</label>
								<div class="relative">
									<input
										type={showNewPassword ? 'text' : 'password'}
										bind:value={newPassword}
										class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
									/>
									<button
										type="button"
										on:click={() => showNewPassword = !showNewPassword}
										class="absolute inset-y-0 right-0 pr-3 flex items-center"
									>
										{#if showNewPassword}
											<EyeOff class="h-4 w-4 text-gray-400" />
										{:else}
											<Eye class="h-4 w-4 text-gray-400" />
										{/if}
									</button>
								</div>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Confirm New Password
								</label>
								<div class="relative">
									<input
										type={showConfirmPassword ? 'text' : 'password'}
										bind:value={confirmPassword}
										class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
									/>
									<button
										type="button"
										on:click={() => showConfirmPassword = !showConfirmPassword}
										class="absolute inset-y-0 right-0 pr-3 flex items-center"
									>
										{#if showConfirmPassword}
											<EyeOff class="h-4 w-4 text-gray-400" />
										{:else}
											<Eye class="h-4 w-4 text-gray-400" />
										{/if}
									</button>
								</div>
							</div>
							<button
								type="button"
								on:click={changePassword}
								disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
								class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{#if passwordChanging}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								{/if}
								Change Password
							</button>
						</div>
					</div>

					<!-- Session Timeout -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Session Timeout (minutes)
						</label>
						<select
							bind:value={settings.account.sessionTimeout}
							class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
						>
							<option value={15}>15 minutes</option>
							<option value={30}>30 minutes</option>
							<option value={60}>1 hour</option>
							<option value={120}>2 hours</option>
							<option value={480}>8 hours</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Danger Zone -->
			<div class="bg-white shadow rounded-lg border border-red-200">
				<div class="px-6 py-4 border-b border-red-200">
					<div class="flex items-center">
						<Trash2 class="h-5 w-5 text-red-500 mr-2" />
						<h2 class="text-lg font-medium text-red-700">Danger Zone</h2>
					</div>
				</div>
				<div class="px-6 py-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">Delete Account</p>
							<p class="text-sm text-gray-500">Permanently delete your account and all associated data</p>
						</div>
						<button
							type="button"
							on:click={deleteAccount}
							class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
						>
							Delete Account
						</button>
					</div>
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end">
				<button
					type="button"
					on:click={saveSettings}
					disabled={saving}
					class="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if saving}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					{:else}
						<Save class="h-4 w-4 mr-2" />
					{/if}
					Save Settings
				</button>
			</div>
		</div>
	</div>
</div>
