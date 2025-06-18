<script lang="ts">
	import { onMount } from 'svelte';
	import { Users, Award, TrendingUp, Heart, Shield, Target, Home, Star, Menu, X } from 'lucide-svelte';

	let user: any = null;
	let mobileMenuOpen = false;

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

	const values = [
		{
			icon: Shield,
			title: 'Trust & Transparency',
			description: 'We believe in honest, transparent dealings with verified listings and clear communication throughout your property journey.'
		},
		{
			icon: Heart,
			title: 'Customer First',
			description: 'Our clients are at the heart of everything we do. We prioritize your needs and work tirelessly to exceed your expectations.'
		},
		{
			icon: Target,
			title: 'Excellence',
			description: 'We strive for excellence in every interaction, from property listings to customer service, ensuring quality at every step.'
		},
		{
			icon: Users,
			title: 'Community',
			description: 'We build lasting relationships and contribute to the growth of communities across Nigeria through responsible real estate practices.'
		}
	];

	const team = [
		{
			name: 'Adebayo Ogundimu',
			role: 'Chief Executive Officer',
			image: '/team-1.jpg',
			bio: 'Visionary leader with 15+ years in Nigerian real estate. Passionate about transforming how people find and buy properties.'
		},
		{
			name: 'Fatima Ibrahim',
			role: 'Chief Technology Officer',
			image: '/team-2.jpg',
			bio: 'Tech innovator bridging traditional real estate with cutting-edge technology to create seamless user experiences.'
		},
		{
			name: 'Chukwuma Nwosu',
			role: 'Head of Operations',
			image: '/team-3.jpg',
			bio: 'Operations expert ensuring smooth processes and exceptional service delivery across all our platforms and services.'
		},
		{
			name: 'Aisha Mohammed',
			role: 'Head of Agent Relations',
			image: '/team-4.jpg',
			bio: 'Building and nurturing relationships with our network of trusted real estate agents across Nigeria.'
		}
	];

	const milestones = [
		{ year: '2020', event: 'Houserz Founded', description: 'Started with a vision to revolutionize Nigerian real estate' },
		{ year: '2021', event: '1,000+ Properties Listed', description: 'Reached our first major milestone in property listings' },
		{ year: '2022', event: '100+ Verified Agents', description: 'Built a strong network of trusted real estate professionals' },
		{ year: '2023', event: 'Lagos Expansion', description: 'Expanded operations to cover all of Lagos State' },
		{ year: '2024', event: 'National Presence', description: 'Now serving clients across all major Nigerian cities' },
		{ year: '2025', event: 'Technology Innovation', description: 'Launched advanced features including virtual tours and AI matching' }
	];
</script>

<svelte:head>
	<title>About Us - Houserz</title>
	<meta name="description" content="Learn about Houserz - Nigeria's leading real estate platform connecting buyers with their dream properties." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
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
		<h1 class="mb-4 text-3xl font-bold sm:mb-6 sm:text-5xl">About Houserz</h1>
		<p class="mb-8 text-base opacity-90 sm:text-xl">Building your future, one property at a time. Discover our story and mission.</p>
	</div>
</section>

<!-- Mission Section -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
			<div>
				<h2 class="mb-6 text-3xl font-bold text-gray-800 sm:text-4xl">Our Mission</h2>
				<p class="mb-4 text-lg text-gray-600">
					At Houserz, we're on a mission to revolutionize the real estate experience in Nigeria. We believe that finding your dream property should be exciting, transparent, and stress-free.
				</p>
				<p class="mb-6 text-gray-600">
					We connect property seekers with verified listings and trusted agents, providing a platform where transparency meets innovation. Our goal is to make property ownership accessible to every Nigerian, whether you're a first-time buyer or a seasoned investor.
				</p>
				<div class="grid grid-cols-2 gap-4 sm:gap-6">
					<div class="text-center">
						<div class="mb-2 text-2xl font-bold text-green-600 sm:text-3xl">500+</div>
						<div class="text-sm text-gray-600">Properties Listed</div>
					</div>
					<div class="text-center">
						<div class="mb-2 text-2xl font-bold text-blue-600 sm:text-3xl">150+</div>
						<div class="text-sm text-gray-600">Verified Agents</div>
					</div>
					<div class="text-center">
						<div class="mb-2 text-2xl font-bold text-blue-800 sm:text-3xl">2,000+</div>
						<div class="text-sm text-gray-600">Happy Customers</div>
					</div>
					<div class="text-center">
						<div class="mb-2 text-2xl font-bold text-yellow-600 sm:text-3xl">6</div>
						<div class="text-sm text-gray-600">Cities Covered</div>
					</div>
				</div>
			</div>
			<div class="flex justify-center">
				<img src="https://i.pinimg.com/736x/18/38/65/1838650f0f8f3514e368d03f2662300c.jpg" alt="Our Mission" class="rounded-2xl shadow-lg" />
			</div>
		</div>
	</div>
</section>

<!-- Values Section -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold text-gray-800 sm:text-4xl">Our Values</h2>
			<p class="text-gray-600">The principles that guide everything we do</p>
		</div>
		
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each values as value}
				<div class="text-center">
					<div class="mb-4 flex justify-center">
						<div class="rounded-full bg-white p-4 shadow-lg">
							<svelte:component this={value.icon} class="h-8 w-8 text-green-600" />
						</div>
					</div>
					<h3 class="mb-3 text-lg font-bold text-gray-800">{value.title}</h3>
					<p class="text-sm text-gray-600">{value.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Timeline Section -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold text-gray-800 sm:text-4xl">Our Journey</h2>
			<p class="text-gray-600">Key milestones in our growth story</p>
		</div>
		
		<div class="relative">
			<div class="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-green-200"></div>
			<div class="space-y-8">
				{#each milestones as milestone, index}
					<div class="relative flex items-center {index % 2 === 0 ? 'justify-start' : 'justify-end'}">
						<div class="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
						<div class="w-5/12 {index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}">
							<div class="bg-white p-6 rounded-lg shadow-lg">
								<div class="text-lg font-bold text-green-600 mb-2">{milestone.year}</div>
								<h3 class="text-lg font-bold text-gray-800 mb-2">{milestone.event}</h3>
								<p class="text-sm text-gray-600">{milestone.description}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Team Section -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold text-gray-800 sm:text-4xl">Meet Our Team</h2>
			<p class="text-gray-600">The passionate people behind Houserz</p>
		</div>
		
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each team as member}
				<div class="text-center">
					<div class="mb-4 overflow-hidden rounded-full mx-auto w-32 h-32">
						<img src={member.image} alt={member.name} class="w-full h-full object-cover" />
					</div>
					<h3 class="mb-1 text-lg font-bold text-gray-800">{member.name}</h3>
					<p class="mb-3 text-sm font-medium text-green-600">{member.role}</p>
					<p class="text-sm text-gray-600">{member.bio}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="bg-blue-600 py-16 text-white sm:py-20">
	<div class="mx-auto max-w-4xl px-4 text-center sm:px-6">
		<h2 class="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">Ready to Start Your Property Journey?</h2>
		<p class="mb-6 text-base opacity-90 sm:mb-8 sm:text-xl">Join thousands of satisfied customers who have found their dream properties with Houserz.</p>
		<div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
			<a href="/properties" class="rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-800 transition-colors hover:bg-gray-100 sm:px-8 sm:py-4 sm:text-lg">
				Browse Properties
			</a>
			<a href="/contact" class="rounded-lg border-2 border-white px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white hover:text-blue-800 sm:px-8 sm:py-4 sm:text-lg">
				Contact Us
			</a>
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
