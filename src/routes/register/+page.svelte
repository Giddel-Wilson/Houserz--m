<script lang="ts">
	import { goto } from '$app/navigation';
	import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-svelte';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let role = 'buyer';
	let showPassword = false;
	let showConfirmPassword = false;
	let loading = false;
	let error = '';

	async function handleRegister() {
		if (!name || !email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters long';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email, password, role })
			});

			const data = await response.json();

			if (response.ok) {
				// Store token in localStorage
				localStorage.setItem('houserz_token', data.token);
				localStorage.setItem('houserz_user', JSON.stringify(data.user));
				
				// Redirect to login page after successful registration
				goto('/login');
			} else {
				error = data.error || 'Registration failed';
			}
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}
</script>

<svelte:head>
	<title>Sign Up - Houserz</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Houserz</h1>
			<h2 class="text-2xl font-bold text-gray-700">Create your account</h2>
			<p class="mt-2 text-gray-600">Join thousands finding their perfect home</p>
		</div>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
			{#if error}
				<div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			<form on:submit|preventDefault={handleRegister} class="space-y-6">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700">
						Full Name
					</label>
					<div class="mt-1 relative">
						<input
							id="name"
							type="text"
							bind:value={name}
							required
							class="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
							placeholder="Enter your full name"
						/>
						<User class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
					</div>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Email address
					</label>
					<div class="mt-1 relative">
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
							placeholder="Enter your email"
						/>
						<Mail class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
					</div>
				</div>

				<div>
					<label for="role" class="block text-sm font-medium text-gray-700">
						Account Type
					</label>
					<div class="mt-1 relative">
						<select
							id="role"
							bind:value={role}
							class="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
						>
							<option value="buyer">Property Buyer/Renter</option>
							<option value="agent">Real Estate Agent</option>
						</select>
						<UserCheck class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
					</div>
					<p class="mt-1 text-xs text-gray-500">
						{#if role === 'agent'}
							Agent accounts require admin approval before listing properties
						{:else}
							Browse and save your favorite properties
						{/if}
					</p>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="mt-1 relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							class="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
							placeholder="Create a password"
						/>
						<Lock class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
						<button
							type="button"
							on:click={togglePasswordVisibility}
							class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
						>
							{#if showPassword}
								<EyeOff class="w-5 h-5" />
							{:else}
								<Eye class="w-5 h-5" />
							{/if}
						</button>
					</div>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
						Confirm Password
					</label>
					<div class="mt-1 relative">
						<input
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							required
							class="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
							placeholder="Confirm your password"
						/>
						<Lock class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
						<button
							type="button"
							on:click={toggleConfirmPasswordVisibility}
							class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
						>
							{#if showConfirmPassword}
								<EyeOff class="w-5 h-5" />
							{:else}
								<Eye class="w-5 h-5" />
							{/if}
						</button>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
						{:else}
							Create Account
						{/if}
					</button>
				</div>

				<div class="text-center">
					<p class="text-sm text-gray-600">
						Already have an account?
						<a href="/login" class="font-medium text-green-600 hover:text-green-500">
							Sign in here
						</a>
					</p>
				</div>
			</form>
		</div>
	</div>
</div>
