<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		Settings, 
		Shield, 
		Bell, 
		Globe, 
		Database, 
		Key,
		Mail,
		Smartphone,
		Save,
		AlertCircle,
		CheckCircle
	} from 'lucide-svelte';

	let user: any = null;
	let settings = {
		siteName: 'Houserz',
		siteDescription: 'Find your perfect property',
		adminEmail: '',
		supportEmail: '',
		smsProvider: 'twilio',
		emailProvider: 'sendgrid',
		maintenanceMode: false,
		userRegistration: true,
		agentApproval: true,
		maxFileSize: 10,
		allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
		securitySettings: {
			requireEmailVerification: true,
			passwordMinLength: 8,
			sessionTimeout: 24,
			maxLoginAttempts: 5
		},
		notificationSettings: {
			emailNewAgent: true,
			emailNewProperty: true,
			emailNewMessage: true,
			smsEnabled: false
		}
	};
	let loading = true;
	let saving = false;
	let message = '';
	let messageType: 'success' | 'error' = 'success';

	onMount(() => {
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (!userData || !token) {
			goto('/login');
			return;
		}
		
		user = JSON.parse(userData);
		
		// Check admin role
		if (user.role !== 'ADMIN' && user.role !== 'admin') {
			goto('/dashboard');
			return;
		}
		
		loadSettings();
	});

	async function loadSettings() {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/settings', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				settings = { ...settings, ...data };
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		} finally {
			loading = false;
		}
	}

	async function saveSettings() {
		saving = true;
		message = '';
		
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/admin/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(settings)
			});

			if (response.ok) {
				message = 'Settings saved successfully!';
				messageType = 'success';
			} else {
				message = 'Failed to save settings. Please try again.';
				messageType = 'error';
			}
		} catch (error) {
			message = 'An error occurred while saving settings.';
			messageType = 'error';
		} finally {
			saving = false;
			setTimeout(() => message = '', 3000);
		}
	}

	function addFileType() {
		const newType = prompt('Enter file extension (without dot):');
		if (newType && !settings.allowedFileTypes.includes(newType.toLowerCase())) {
			settings.allowedFileTypes = [...settings.allowedFileTypes, newType.toLowerCase()];
		}
	}

	function removeFileType(type: string) {
		settings.allowedFileTypes = settings.allowedFileTypes.filter(t => t !== type);
	}
</script>

<svelte:head>
	<title>Settings - Admin - Houserz</title>
</svelte:head>

<div class="space-y-6 relative flex justify-center items-center h-full overflow-hidden">
	<!-- Coming Soon Overlay -->
	<div class="absolute inset-0 z-20 bg-gray-100 bg-opacity-80 backdrop-blur-sm">
		<div class="flex items-center justify-center min-h-full">
			<div class="bg-white rounded-2xl shadow-lg p-8 mx-4 max-w-lg w-full text-center border border-gray-200">
				<div class="mb-6">
					<div class="mx-auto w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-4">
						<Settings class="h-8 w-8 text-white" />
					</div>
					<h2 class="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
					<p class="text-gray-600 text-sm leading-relaxed">
						Advanced platform settings and configurations are currently under development. 
						These features will be available in a future update.
					</p>
				</div>
				<div class="space-y-3 text-sm text-gray-500">
					<div class="flex items-center justify-center">
						<div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
						<span>Security & Authentication</span>
					</div>
					<div class="flex items-center justify-center">
						<div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
						<span>Notification Management</span>
					</div>
					<div class="flex items-center justify-center">
						<div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
						<span>Platform Configuration</span>
					</div>
				</div>
				<div class="mt-6 pt-4 border-t border-gray-200">
					<p class="text-xs text-gray-400">
						Expected release: Q2 2025
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Muted Background Content -->
	<div class="opacity-30 pointer-events-none select-none">
		<!-- Header -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">Platform Settings</h1>
					<p class="text-gray-600 mt-1">Configure global platform settings and preferences</p>
				</div>
				<button
					disabled
					class="flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
				>
					<Save class="h-4 w-4 mr-2" />
					Save Settings
				</button>
			</div>
		</div>

	<!-- Status Message -->
	{#if message}
		<div class="p-4 rounded-lg {messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
			<div class="flex items-center">
				{#if messageType === 'success'}
					<CheckCircle class="h-5 w-5 text-green-600 mr-2" />
				{:else}
					<AlertCircle class="h-5 w-5 text-red-600 mr-2" />
				{/if}
				<span class="{messageType === 'success' ? 'text-green-800' : 'text-red-800'}">{message}</span>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
			<span class="ml-3 text-gray-600">Loading settings...</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- General Settings -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div class="flex items-center mb-4">
					<Globe class="h-5 w-5 text-red-600 mr-2" />
					<h2 class="text-lg font-semibold text-gray-900">General Settings</h2>
				</div>
							<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
						<input
							type="text"
							bind:value={settings.siteName}
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
						<textarea
							bind:value={settings.siteDescription}
							rows="3"
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						></textarea>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
						<input
							type="email"
							bind:value={settings.adminEmail}
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
						<input
							type="email"
							bind:value={settings.supportEmail}
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
				</div>
			</div>

			<!-- Security Settings -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div class="flex items-center mb-4">
					<Shield class="h-5 w-5 text-red-600 mr-2" />
					<h2 class="text-lg font-semibold text-gray-900">Security Settings</h2>
				</div>
							<div class="space-y-4">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Require Email Verification</label>
						<input
							type="checkbox"
							bind:checked={settings.securitySettings.requireEmailVerification}
							disabled
							class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
						<input
							type="number"
							bind:value={settings.securitySettings.passwordMinLength}
							min="6"
							max="20"
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
						<input
							type="number"
							bind:value={settings.securitySettings.sessionTimeout}
							min="1"
							max="72"
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
						<input
							type="number"
							bind:value={settings.securitySettings.maxLoginAttempts}
							min="3"
							max="10"
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
				</div>
			</div>

			<!-- Platform Controls -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">				<div class="flex items-center mb-4">
					<Settings class="h-5 w-5 text-gray-400 mr-2" />
					<h2 class="text-lg font-semibold text-gray-900">Platform Controls</h2>
				</div>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Maintenance Mode</label>
						<input
							type="checkbox"
							bind:checked={settings.maintenanceMode}
							disabled
							class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
						/>
					</div>
					
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Allow User Registration</label>
						<input
							type="checkbox"
							bind:checked={settings.userRegistration}
							disabled
							class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
						/>
					</div>
					
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Require Agent Approval</label>
						<input
							type="checkbox"
							bind:checked={settings.agentApproval}
							disabled
							class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
						/>
					</div>
				</div>
			</div>
			<!-- File Upload Settings -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div class="flex items-center mb-4">
					<Database class="h-5 w-5 text-gray-400 mr-2" />
					<h2 class="text-lg font-semibold text-gray-900">File Upload Settings</h2>
				</div>
				
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
						<input
							type="number"
							bind:value={settings.maxFileSize}
							min="1"
							max="50"
							disabled
							class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
						<div class="flex flex-wrap gap-2 mb-2">
							{#each settings.allowedFileTypes as type}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
									.{type}
									<button
										disabled
										class="ml-1 text-gray-400 cursor-not-allowed"
									>
										×
									</button>
								</span>
							{/each}						</div>
						<button
							disabled
							class="text-sm text-gray-400 cursor-not-allowed"
						>
							+ Add File Type
						</button>
					</div>
				</div>
			</div>
			<!-- Notification Settings -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
				<div class="flex items-center mb-4">
					<Bell class="h-5 w-5 text-gray-400 mr-2" />
					<h2 class="text-lg font-semibold text-gray-900">Notification Settings</h2>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-4">
						<h3 class="font-medium text-gray-900">Email Notifications</h3>
						
						<div class="flex items-center justify-between">
							<label class="text-sm text-gray-700">New Agent Registration</label>
							<input
								type="checkbox"
								bind:checked={settings.notificationSettings.emailNewAgent}
								disabled
								class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
							/>
						</div>
						
						<div class="flex items-center justify-between">
							<label class="text-sm text-gray-700">New Property Listed</label>
							<input
								type="checkbox"
								bind:checked={settings.notificationSettings.emailNewProperty}
								disabled
								class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
							/>
						</div>
						
						<div class="flex items-center justify-between">
							<label class="text-sm text-gray-700">New Message Received</label>
							<input
								type="checkbox"
								bind:checked={settings.notificationSettings.emailNewMessage}
								disabled
								class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
							/>
						</div>
					</div>
								<div class="space-y-4">
						<h3 class="font-medium text-gray-900">SMS Settings</h3>
						
						<div class="flex items-center justify-between">
							<label class="text-sm text-gray-700">Enable SMS Notifications</label>
							<input
								type="checkbox"
								bind:checked={settings.notificationSettings.smsEnabled}
								disabled
								class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">SMS Provider</label>
							<select
								bind:value={settings.smsProvider}
								disabled
								class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
							>
								<option value="twilio">Twilio</option>
								<option value="nexmo">Vonage (Nexmo)</option>
								<option value="aws">AWS SNS</option>
							</select>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
							<select
								bind:value={settings.emailProvider}
								disabled
								class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
							>
								<option value="sendgrid">SendGrid</option>
								<option value="mailgun">Mailgun</option>
								<option value="ses">AWS SES</option>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	</div>
</div>
