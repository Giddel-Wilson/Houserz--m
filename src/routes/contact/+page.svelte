<script lang="ts">
	import { onMount } from 'svelte';
	import { MapPin, Phone, Mail, Clock, Send, Menu, X } from 'lucide-svelte';

	let user: any = null;
	let mobileMenuOpen = false;
	let formData = {
		name: '',
		email: '',
		subject: '',
		message: ''
	};
	let isSubmitting = false;
	let submitMessage = '';
	let submitError = '';

	onMount(() => {
		// Check if user is logged in
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		}
	});

	// Add mobile menu toggle function
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	async function handleSubmit() {
		if (!formData.name || !formData.email || !formData.message) {
			submitError = 'Please fill in all required fields';
			return;
		}

		isSubmitting = true;
		submitError = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				submitMessage = 'Thank you for your message! We will get back to you soon.';
				formData = { name: '', email: '', subject: '', message: '' };
			} else {
				const result = await response.json();
				submitError = result.error || 'Failed to send message';
			}
		} catch (error) {
			submitError = 'Failed to send message. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us - Houserz</title>
	<meta name="description" content="Get in touch with Houserz. Contact our team for property inquiries, support, or general questions." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
	<!-- Navigation -->
	<nav class="relative z-50 px-4 py-4 sm:px-6">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<div class="text-xl font-bold text-white sm:text-2xl">Houserz</div>
			
			<!-- Desktop Navigation -->
			<div class="hidden items-center space-x-8 text-white lg:flex">
				<a href="/" class="transition-colors hover:text-green-400">Home</a>
				<a href="/properties" class="transition-colors hover:text-green-400">Properties</a>
				<a href="/contact" class="transition-colors hover:text-green-400">Contact</a>
				<a href="/about" class="transition-colors hover:text-green-400">About</a>
			</div>

			<!-- Desktop Auth Buttons -->
			<div class="hidden items-center space-x-2 sm:space-x-4 lg:flex">
				{#if user}
					{#if user.role === 'agent'}
						<a
							href="/agent"
							class="text-sm text-white transition-colors hover:text-green-400 sm:text-base"
							>Dashboard</a
						>
					{:else if user.role === 'admin'}
						<a
							href="/admin"
							class="text-sm text-white transition-colors hover:text-green-400 sm:text-base"
							>Admin</a
						>
					{:else}
						<a
							href="/dashboard"
							class="text-sm text-white transition-colors hover:text-green-400 sm:text-base"
							>Dashboard</a
						>
					{/if}
					<button
						on:click={() => {
							localStorage.removeItem('token');
							localStorage.removeItem('user');
							user = null;
							window.location.reload();
						}}
						class="rounded-lg bg-red-500 px-3 py-2 text-sm text-white transition-colors hover:bg-red-600 sm:px-6 sm:text-base"
					>
						Logout
					</button>
				{:else}
					<a
						href="/login"
						class="text-sm text-white transition-colors hover:text-green-400 sm:text-base"
						>Sign In</a
					>
					<a
						href="/register"
						class="rounded-lg bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 sm:px-6 sm:text-base"
					>
						Get Started
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<div class="flex items-center lg:hidden">
				<button
					on:click={toggleMobileMenu}
					class="text-white hover:text-green-400 focus:outline-none"
				>
					{#if mobileMenuOpen}
						<X class="h-6 w-6" />
					{:else}
						<Menu class="h-6 w-6" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="lg:hidden">
				<div class="mt-4 rounded-lg px-4 py-6 shadow-xl border border-gray-400/30">
					<!-- Mobile Navigation Links -->
					<div class="space-y-4">
						<a href="/" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Home</a>
						<a href="/properties" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Properties</a>
						<a href="/contact" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>Contact</a>
						<a href="/about" class="block text-white transition-colors hover:text-green-400" on:click={toggleMobileMenu}>About</a>
					</div>

					<!-- Mobile Auth Section -->
					<div class="mt-6 border-t border-gray-700 pt-6">
						{#if user}
							<div class="space-y-4">
								{#if user.role === 'agent'}
									<a
										href="/agent"
										class="block text-white transition-colors hover:text-green-400"
										on:click={toggleMobileMenu}
										>Dashboard</a
									>
								{:else if user.role === 'admin'}
									<a
										href="/admin"
										class="block text-white transition-colors hover:text-green-400"
										on:click={toggleMobileMenu}
										>Admin</a
									>
								{:else}
									<a
										href="/dashboard"
										class="block text-white transition-colors hover:text-green-400"
										on:click={toggleMobileMenu}
										>Dashboard</a
									>
								{/if}
								<button
									on:click={() => {
										localStorage.removeItem('token');
										localStorage.removeItem('user');
										user = null;
										toggleMobileMenu();
										window.location.reload();
									}}
									class="w-full rounded-lg bg-red-500 px-4 py-2 text-left text-white transition-colors hover:bg-red-600"
								>
									Logout
								</button>
							</div>
						{:else}
							<div class="space-y-4">
								<a
									href="/login"
									class="block text-white transition-colors hover:text-green-400"
									on:click={toggleMobileMenu}
									>Sign In</a
								>
								<a
									href="/register"
									class="block w-full rounded-lg bg-green-500 px-4 py-2 text-center text-white transition-colors hover:bg-green-600"
									on:click={toggleMobileMenu}
								>
									Get Started
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</nav>

	<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 py-16">
		<h1 class="mb-4 text-3xl font-bold sm:text-5xl">Contact Us</h1>
		<p class="text-lg opacity-90 sm:text-xl">
			Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
		</p>
	</div>
</section>

<!-- Contact Section -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
			<!-- Contact Information -->
			<div>
				<h2 class="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl">Get in Touch</h2>
				<p class="mb-8 text-gray-600">
					Whether you're looking to buy, sell, or rent a property, our team is here to help. Reach out to us through any of the channels below.
				</p>

				<div class="space-y-6">
					<!-- Address -->
					<div class="flex items-start space-x-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
							<MapPin class="h-6 w-6 text-green-600" />
						</div>
						<div>
							<h3 class="font-semibold text-gray-800">Address</h3>
							<p class="text-gray-600">
								123 Victoria Island<br />
								Lagos, Nigeria<br />
								100001
							</p>
						</div>
					</div>

					<!-- Phone -->
					<div class="flex items-start space-x-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
							<Phone class="h-6 w-6 text-green-600" />
						</div>
						<div>
							<h3 class="font-semibold text-gray-800">Phone</h3>
							<p class="text-gray-600">
								+234 (0) 801 234 5678<br />
								+234 (0) 802 345 6789
							</p>
						</div>
					</div>

					<!-- Email -->
					<div class="flex items-start space-x-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
							<Mail class="h-6 w-6 text-green-600" />
						</div>
						<div>
							<h3 class="font-semibold text-gray-800">Email</h3>
							<p class="text-gray-600">
								info@houserz.com<br />
								support@houserz.com
							</p>
						</div>
					</div>

					<!-- Business Hours -->
					<div class="flex items-start space-x-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
							<Clock class="h-6 w-6 text-green-600" />
						</div>
						<div>
							<h3 class="font-semibold text-gray-800">Business Hours</h3>
							<p class="text-gray-600">
								Monday - Friday: 9:00 AM - 6:00 PM<br />
								Saturday: 10:00 AM - 4:00 PM<br />
								Sunday: Closed
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Form -->
			<div class="rounded-2xl bg-gray-50 p-6 sm:p-8">
				<h2 class="mb-6 text-2xl font-bold text-gray-800">Send us a Message</h2>

				{#if submitMessage}
					<div class="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
						{submitMessage}
					</div>
				{/if}

				{#if submitError}
					<div class="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
						{submitError}
					</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<!-- Name -->
					<div>
						<label for="name" class="mb-2 block text-sm font-semibold text-gray-700">
							Full Name *
						</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none"
							placeholder="Enter your full name"
							required
						/>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="mb-2 block text-sm font-semibold text-gray-700">
							Email Address *
						</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none"
							placeholder="Enter your email address"
							required
						/>
					</div>

					<!-- Subject -->
					<div>
						<label for="subject" class="mb-2 block text-sm font-semibold text-gray-700">
							Subject
						</label>
						<input
							type="text"
							id="subject"
							bind:value={formData.subject}
							class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none"
							placeholder="Enter message subject"
						/>
					</div>

					<!-- Message -->
					<div>
						<label for="message" class="mb-2 block text-sm font-semibold text-gray-700">
							Message *
						</label>
						<textarea
							id="message"
							bind:value={formData.message}
							rows="5"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none"
							placeholder="Enter your message"
							required
						></textarea>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex w-full items-center justify-center rounded-lg bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
					>
						{#if isSubmitting}
							<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
							Sending...
						{:else}
							<Send class="mr-2 h-4 w-4" />
							Send Message
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
</section>

<!-- Map Section -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<h2 class="mb-8 text-center text-2xl font-bold text-gray-800 sm:text-3xl">Visit Our Office</h2>
		<div class="h-96 rounded-2xl overflow-hidden shadow-lg">
			<iframe
				src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.6356480844546!2d3.4207841!3d6.436631099999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf4c7c5e42857%3A0x6b7b3d3b3b3b3b3b!2sVictoria%20Island%2C%20Lagos%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1748759384963!5m2!1sen!2sng"
				class="h-full w-full border-0"
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
				title="Houserz Office Location"
			></iframe>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 py-12 text-white sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-6 grid grid-cols-1 gap-6 sm:mb-8 sm:grid-cols-2 sm:gap-8 md:grid-cols-4">
			<div class="text-center sm:text-left">
				<h3 class="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Houserz</h3>
				<p class="mb-3 text-sm text-gray-400 sm:mb-4 sm:text-base">
					Building your future, one property at a time.
				</p>
				<div class="flex justify-center space-x-4 sm:justify-start">
					<!-- Social media icons would go here -->
				</div>
			</div>
			<div class="text-center sm:text-left">
				<h4 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Quick Links</h4>
				<ul class="space-y-1 text-sm text-gray-400 sm:space-y-2 sm:text-base">
					<li><a href="/properties" class="transition-colors hover:text-white">Properties</a></li>
					<li><a href="/agents" class="transition-colors hover:text-white">Agents</a></li>
					<li><a href="/about" class="transition-colors hover:text-white">About Us</a></li>
					<li><a href="/contact" class="transition-colors hover:text-white">Contact</a></li>
				</ul>
			</div>
			<div class="text-center sm:text-left">
				<h4 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Services</h4>
				<ul class="space-y-1 text-sm text-gray-400 sm:space-y-2 sm:text-base">
					<li><a href="/properties?type=sale" class="transition-colors hover:text-white">Buy Property</a></li>
					<li><a href="/properties?type=rent" class="transition-colors hover:text-white">Rent Property</a></li>
					<li><a href="/contact" class="transition-colors hover:text-white">Property Management</a></li>
					<li><a href="/contact" class="transition-colors hover:text-white">Investment</a></li>
				</ul>
			</div>
			<div class="text-center sm:text-left">
				<h4 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
					Discover Nature's Wonders with Expert Guidance
				</h4>
				<p class="mb-3 text-sm text-gray-400 sm:mb-4">
					Find the perfect property that connects you with Nigeria's beautiful landscapes and urban
					centers.
				</p>
			</div>
		</div>
		<div
			class="flex flex-col items-center justify-between space-y-4 border-t border-gray-800 pt-6 sm:flex-row sm:space-y-0 sm:pt-8"
		>
			<p class="text-center text-xs text-gray-400 sm:text-left sm:text-sm">
				© 2025 Houserz. All rights reserved.
			</p>
			<div class="flex space-x-4 text-xs text-gray-400 sm:space-x-6 sm:text-sm">
				<a href="/privacy" class="transition-colors hover:text-white">Privacy Policy</a>
				<a href="/terms" class="transition-colors hover:text-white">Terms & Conditions</a>
			</div>
		</div>
	</div>
</footer>
