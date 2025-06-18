<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronDown, Star, MapPin, Home, Users, TrendingUp, MessageCircle, Menu, X } from 'lucide-svelte';

	let currentSlide = 0;
	let testimonialIndex = 0;
	let user: any = null;
	let openFaqItems = new Set<number>([0]); // Initialize with first FAQ open
	let mobileMenuOpen = false;

	onMount(() => {
		// Check if user is logged in
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		}
	});

	const properties = [
		{
			id: 1,
			title: 'The Pinnacle at Highland Park',
			location: 'Lagos, Nigeria',
			price: '₦85,000,000',
			type: 'For Sale',
			image: '/house-1.jpg',
			beds: 4,
			baths: 3,
			sqft: '2,500'
		},
		{
			id: 2,
			title: 'The Pinnacle at Highland Park',
			location: 'Abuja, Nigeria',
			price: '₦120,000,000',
			type: 'For Sale',
			image: '/house-2.jpg',
			beds: 5,
			baths: 4,
			sqft: '3,200'
		},
		{
			id: 3,
			title: 'The Pinnacle at Highland Park',
			location: 'Port Harcourt, Nigeria',
			price: '₦95,000,000',
			type: 'For Sale',
			image: '/house-3.jpg',
			beds: 4,
			baths: 3,
			sqft: '2,800'
		},
		{
			id: 4,
			title: 'The Pinnacle at Highland Park',
			location: 'Ibadan, Nigeria',
			price: '₦75,000,000',
			type: 'For Sale',
			image: '/house-4.jpg',
			beds: 3,
			baths: 2,
			sqft: '2,200'
		},
		{
			id: 5,
			title: 'The Pinnacle at Highland Park',
			location: 'Kano, Nigeria',
			price: '₦110,000,000',
			type: 'For Sale',
			image: '/house-5.jpg',
			beds: 5,
			baths: 4,
			sqft: '3,500'
		},
		{
			id: 6,
			title: 'The Pinnacle at Highland Park',
			location: 'Enugu, Nigeria',
			price: '₦90,000,000',
			type: 'For Sale',
			image: '/house-6.jpg',
			beds: 4,
			baths: 3,
			sqft: '2,600'
		}
	];

	const testimonials = [
		{
			name: 'Mary James',
			role: 'Client',
			rating: 5,
			text: "Working with this team was a pleasure. They understood our vision and helped us find a property that exceeded our expectations. We couldn't have done it without them!",
			image: '/testimonial-1.jpg'
		},
		{
			name: 'Ahmed Bello',
			role: 'Property Investor',
			rating: 5,
			text: 'Excellent service and professional guidance throughout the entire process. They helped me identify profitable investment opportunities in Lagos that have already shown great returns.',
			image: '/testimonial-2.jpg'
		},
		{
			name: 'Sarah Okafor',
			role: 'First-time Buyer',
			rating: 5,
			text: 'As a first-time buyer, I was nervous about the process. The team made everything so easy and explained every step. I found my dream home in Abuja within weeks!',
			image: '/testimonial-3.jpg'
		},
		{
			name: 'David Chen',
			role: 'Expatriate',
			rating: 5,
			text: 'Moving to Nigeria for work, I needed reliable help finding quality accommodation. Houserz delivered beyond expectations with their local expertise and international standards.',
			image: '/testimonial-4.jpg'
		},
		{
			name: 'Fatima Ibrahim',
			role: 'Family Buyer',
			rating: 5,
			text: 'Finding a family home in a good neighborhood was crucial for us. The team understood our needs perfectly and found us the ideal property in a safe, family-friendly area.',
			image: '/testimonial-5.jpg'
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			currentSlide = (currentSlide + 1) % 3;
		}, 5000);

		// Auto-cycle testimonials
		const testimonialInterval = setInterval(() => {
			testimonialIndex = (testimonialIndex + 1) % testimonials.length;
		}, 4000);

		return () => {
			clearInterval(interval);
			clearInterval(testimonialInterval);
		};
	});

	function handleSearch() {
		// Handle search functionality
		console.log('Search initiated');
	}

	// Add FAQ toggle function
	function toggleFaq(index: number) {
		if (openFaqItems.has(index)) {
			openFaqItems.delete(index);
		} else {
			openFaqItems.add(index);
		}
		openFaqItems = new Set(openFaqItems); // Trigger reactivity
	}

	// Add testimonial navigation function
	function goToTestimonial(index: number) {
		testimonialIndex = index;
	}

	// Add mobile menu toggle function
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<svelte:head>
	<title>Houserz - Build Your Future, One Property at a Time</title>
	<meta
		name="description"
		content="Find the best properties in Nigeria. Connect with verified real estate agents."
	/>
</svelte:head>

<!-- Hero Section -->
<section class="relative h-full lg:h-screen overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800">
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
	<!-- Background Image Slider -->
	<div class="absolute inset-0">
		{#each ['/hero-1.jpg', '/hero-2.jpg', '/hero-3.jpg'] as image, i}
			<div
				class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 {currentSlide ===
				i
					? 'opacity-70'
					: 'opacity-0'}"
				style="background-image: url('{image}')"
			></div>
		{/each}
		<div class="absolute inset-0 bg-black opacity-40"></div>
	</div>

	<div class="relative z-10 flex h-full items-center mt-4 md:mt-8 lg:mt-auto">
		<div class="mx-auto max-w-7xl px-4 text-white sm:px-6">
			<div class="max-w-3xl">
				<h1 class="mb-4 text-3xl leading-tight font-bold sm:mb-6 sm:text-5xl md:text-5xl lg:text-7xl text-center">
					Build Your Future, One Property at a Time.
				</h1>
				<p class="mb-6 text-base opacity-90 sm:mb-8 sm:text-xl text-center">
					Discover premium properties across Nigeria. Connect with verified real estate agents and
					find your dream home today.
				</p>

				<!-- Search Form -->
				<div class="rounded-2xl bg-white p-4 mb-8 shadow-2xl sm:p-6">
					<h3 class="mb-4 text-base font-semibold text-gray-800 sm:text-lg">Find the best place</h3>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
						<div>
							<label class="mb-2 block text-sm text-gray-600">Location</label>
							<select class="w-full rounded-lg border border-gray-300 p-3 text-gray-800">
								<option>Lagos</option>
								<option>Abuja</option>
								<option>Port Harcourt</option>
								<option>Ibadan</option>
								<option>Kano</option>
								<option>Enugu</option>
							</select>
						</div>
						<div>
							<label class="mb-2 block text-sm text-gray-600">Property Type</label>
							<select class="w-full rounded-lg border border-gray-300 p-3 text-gray-800">
								<option>Any Type</option>
								<option>House</option>
								<option>Apartment</option>
								<option>Duplex</option>
								<option>Bungalow</option>
							</select>
						</div>
						<div>
							<label class="mb-2 block text-sm text-gray-600">Number of rooms</label>
							<select class="w-full rounded-lg border border-gray-300 p-3 text-gray-800">
								<option>Any</option>
								<option>1 Room</option>
								<option>2 Rooms</option>
								<option>3 Rooms</option>
								<option>4+ Rooms</option>
							</select>
						</div>
						<div>
							<label class="mb-2 block text-sm text-gray-600">Price Range</label>
							<select class="w-full rounded-lg border border-gray-300 p-3 text-gray-800">
								<option>Any Price</option>
								<option>₦10M - ₦50M</option>
								<option>₦50M - ₦100M</option>
								<option>₦100M+</option>
							</select>
						</div>
					</div>
					<button
						on:click={handleSearch}
						class="mt-4 w-full rounded-lg bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:mt-6 sm:py-4 sm:text-base"
					>
						Search Properties
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Floating Stats -->
	<div class="absolute top-1/2 right-4 hidden -translate-y-1/2 transform sm:right-8 lg:block">
		<div class="rounded-2xl bg-white p-6 text-center shadow-2xl">
			<div class="mb-2 text-green-500">
				<Home class="mx-auto h-8 w-8" />
			</div>
			<p class="text-sm text-gray-600">Exploring with a unique flavor</p>
			<p class="mt-1 text-xs text-gray-500">Find properties that match your lifestyle</p>
		</div>
	</div>
</section>

<!-- Secondary Message -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="flex flex-col items-center justify-between space-y-4  sm:space-y-0">
			<div>
				<h2 class="mb-4 text-center text-2xl font-bold text-gray-800 sm:text-4xl">
					Your primary home might begin to feel left out.
				</h2>
			</div>
			<div class="block sm:hidden md:block">
				<div class="rounded-full bg-green-500 p-3 sm:p-4">
					<MessageCircle class="h-6 w-6 text-white sm:h-8 sm:w-8" />
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Property Showcase -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-12 grid grid-cols-1 items-center gap-8 sm:mb-16 sm:gap-12 lg:grid-cols-2">
			<div>
				<div
					class="flex h-64 items-center justify-center rounded-2xl bg-gray-100 p-4 sm:h-96 sm:p-8"
				>
					<img
						src="/featured-house.jpg"
						alt="Featured Property"
						class="h-full w-full rounded-xl object-cover"
					/>
				</div>
			</div>
			<div class="text-center lg:text-left">
				<h3 class="mb-4 text-2xl font-bold text-gray-800 sm:mb-6 sm:text-3xl">
					Big things can happen in small spaces.
				</h3>
				<p class="mb-6 text-gray-600 sm:mb-8">
					Discover the perfect property that fits your lifestyle. From cozy apartments to spacious
					family homes, we have something for everyone.
				</p>
				<button
					class="rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800 sm:px-8 sm:py-3"
				>
					Explore Properties
				</button>
			</div>
		</div>
	</div>
</section>

<!-- Stats Section -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="grid grid-cols-2 gap-6 text-center sm:gap-8 md:grid-cols-4">
			<div>
				<div class="mb-2 text-2xl font-bold text-gray-800 sm:text-4xl">100%</div>
				<div class="text-sm text-gray-600 sm:text-base">Client Satisfaction</div>
			</div>
			<div>
				<div class="mb-2 text-2xl font-bold text-gray-800 sm:text-4xl">500+</div>
				<div class="text-sm text-gray-600 sm:text-base">Properties Listed</div>
			</div>
			<div>
				<div class="mb-2 text-2xl font-bold text-gray-800 sm:text-4xl">150+</div>
				<div class="text-sm text-gray-600 sm:text-base">Verified Agents</div>
			</div>
			<div>
				<div class="mb-2 text-2xl font-bold text-gray-800 sm:text-4xl">2,00+</div>
				<div class="text-sm text-gray-600 sm:text-base">Happy Customers</div>
			</div>
		</div>
	</div>
</section>

<!-- Map Section -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2">
			<div class="order-2 text-center lg:order-1 lg:text-left">
				<h3 class="mb-4 text-2xl font-bold text-gray-800 sm:mb-6 sm:text-3xl">
					Discover Properties with the Best Value
				</h3>
				<p class="mb-6 text-gray-600 sm:mb-8">
					Explore prime locations across Nigeria. Our interactive map helps you discover properties
					in the most desirable neighborhoods.
				</p>
				<button
					class="rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800 sm:px-8 sm:py-3"
				>
					View on Map
				</button>
			</div>
			<div class="order-1 lg:order-2">
				<div class="h-64 rounded-2xl bg-gray-100 p-4 sm:h-96 sm:p-8">
					<!-- Map iframe -->
					<div class="h-full w-full overflow-hidden rounded-xl relative">
						<iframe 
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d8070637.89393842!2d3.3820479748723944!3d8.995948651636704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104e0baf7da48d0d%3A0x99a8fe4168c50bc8!2sNigeria!5e0!3m2!1sen!2sng!4v1748759384963!5m2!1sen!2sng" 
							class="h-full w-full border-0" 
							loading="lazy" 
							referrerpolicy="no-referrer-when-downgrade"
							title="Nigeria Map"
						></iframe>
						<!-- Map Pin Overlay -->
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
							<MapPin class="absolute mx-auto mb-3 h-12 w-12 text-green-500 sm:mb-4 sm:h-16 sm:w-16" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Properties Grid -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div
			class="mb-8 flex flex-col items-center justify-between space-y-4 sm:mb-12 sm:flex-row sm:space-y-0"
		>
			<h2 class="text-center text-2xl font-bold text-gray-800 sm:text-left sm:text-4xl">
				Explore our premier houses
			</h2>
			<button
				class="rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800 sm:px-8 sm:py-3"
			>
				View All
			</button>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
			{#each properties as property}
				<div
					class="overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-xl"
				>
					<div class="relative h-48 sm:h-64">
						<img src={property.image} alt={property.title} class="h-full w-full object-cover" />
						<div
							class="absolute top-3 left-3 rounded-lg bg-black px-2 py-1 text-xs text-white sm:top-4 sm:left-4 sm:px-3 sm:text-sm"
						>
							{property.type}
						</div>
						<div
							class="absolute top-3 right-3 cursor-pointer rounded-full bg-white p-1.5 hover:bg-gray-100 sm:top-4 sm:right-4 sm:p-2"
						>
							<Star class="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
						</div>
					</div>
					<div class="p-4 sm:p-6">
						<h3 class="mb-2 text-lg font-bold text-gray-800 sm:text-xl">{property.title}</h3>
						<div class="mb-3 flex items-center text-gray-600 sm:mb-4">
							<MapPin class="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
							<span class="text-xs sm:text-sm">{property.location}</span>
						</div>
						<div class="mb-3 flex items-center justify-between sm:mb-4">
							<div class="text-xl font-bold text-gray-800 sm:text-2xl">{property.price}</div>
						</div>
						<div class="flex items-center justify-between text-xs text-gray-600 sm:text-sm">
							<span>{property.beds} beds</span>
							<span>{property.baths} baths</span>
							<span>{property.sqft} sqft</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- FAQ Section -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-4xl px-4 sm:px-6">
		<h2 class="mb-8 text-center text-2xl font-bold text-gray-800 sm:mb-12 sm:text-4xl">
			Frequently asked questions
		</h2>

		<div class="space-y-4 sm:space-y-6">
			<div class="border-b border-gray-200 pb-4 sm:pb-6">
				<button
					class="flex w-full items-center justify-between text-left"
					on:click={() => toggleFaq(0)}
				>
					<span class="pr-4 text-base font-semibold text-gray-800 sm:text-lg"
						>What types of properties do you sell?</span
					>
					<ChevronDown
						class="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform sm:h-5 sm:w-5 {openFaqItems.has(
							0
						)
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if openFaqItems.has(0)}
					<div class="mt-3 text-sm text-gray-600 sm:mt-4 sm:text-base">
						We specialize in residential, commercial, and luxury properties, offering a wide range
						of options for buyers, renters, and investors across Nigeria.
					</div>
				{/if}
			</div>

			<div class="border-b border-gray-200 pb-4 sm:pb-6">
				<button
					class="flex w-full items-center justify-between text-left"
					on:click={() => toggleFaq(1)}
				>
					<span class="pr-4 text-base font-semibold text-gray-800 sm:text-lg"
						>How do I know if a property is a good investment?</span
					>
					<ChevronDown
						class="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform sm:h-5 sm:w-5 {openFaqItems.has(
							1
						)
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if openFaqItems.has(1)}
					<div class="mt-3 text-sm text-gray-600 sm:mt-4 sm:text-base">
						Our experienced agents analyze market trends, location value, property condition, and
						growth potential to help you make informed investment decisions. We provide detailed
						market reports and ROI projections for each property.
					</div>
				{/if}
			</div>

			<div class="border-b border-gray-200 pb-4 sm:pb-6">
				<button
					class="flex w-full items-center justify-between text-left"
					on:click={() => toggleFaq(2)}
				>
					<span class="pr-4 text-base font-semibold text-gray-800 sm:text-lg"
						>Do I need to hire a real estate agent?</span
					>
					<ChevronDown
						class="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform sm:h-5 sm:w-5 {openFaqItems.has(
							2
						)
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if openFaqItems.has(2)}
					<div class="mt-3 text-sm text-gray-600 sm:mt-4 sm:text-base">
						While not mandatory, working with our verified real estate agents provides valuable
						expertise, market knowledge, and negotiation skills. Our agents handle paperwork,
						coordinate viewings, and ensure smooth transactions while protecting your interests.
					</div>
				{/if}
			</div>

			<div class="border-b border-gray-200 pb-4 sm:pb-6">
				<button
					class="flex w-full items-center justify-between text-left"
					on:click={() => toggleFaq(3)}
				>
					<span class="pr-4 text-base font-semibold text-gray-800 sm:text-lg"
						>What's the process for buying a property?</span
					>
					<ChevronDown
						class="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform sm:h-5 sm:w-5 {openFaqItems.has(
							3
						)
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if openFaqItems.has(3)}
					<div class="mt-3 text-sm text-gray-600 sm:mt-4 sm:text-base">
						The process includes: property search and viewing, making an offer, property inspection,
						securing financing, legal documentation review, final negotiations, and closing the
						transaction. Our team guides you through each step.
					</div>
				{/if}
			</div>

			<div class="pb-4 sm:pb-6">
				<button
					class="flex w-full items-center justify-between text-left"
					on:click={() => toggleFaq(4)}
				>
					<span class="pr-4 text-base font-semibold text-gray-800 sm:text-lg"
						>Can I tour a property before purchasing?</span
					>
					<ChevronDown
						class="h-4 w-4 flex-shrink-0 text-gray-600 transition-transform sm:h-5 sm:w-5 {openFaqItems.has(
							4
						)
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if openFaqItems.has(4)}
					<div class="mt-3 text-sm text-gray-600 sm:mt-4 sm:text-base">
						Absolutely! We encourage property tours and can arrange virtual or in-person viewings.
						You can schedule multiple visits, bring experts for inspections, and take time to
						evaluate the property thoroughly before making a decision.
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<!-- Testimonials -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-4xl px-4 sm:px-6">
		<h2 class="mb-3 text-center text-2xl font-bold text-gray-800 sm:mb-4 sm:text-4xl">
			What our clients say about us
		</h2>
		<div class="mb-8 flex items-center justify-center sm:mb-12">
			<div class="flex items-center space-x-2">
				<span class="text-xs text-gray-600 sm:text-sm">More than 500+</span>
				<div class="flex space-x-1">
					{#each Array(5) as _}
						<Star class="h-3 w-3 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4" />
					{/each}
				</div>
				<span class="text-xs text-gray-600 sm:text-sm">Client Reviews</span>
			</div>
		</div>

		<div class="rounded-2xl bg-white p-4 shadow-lg sm:p-8">
			<div class="flex flex-col items-start space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
				<img
					src={testimonials[testimonialIndex].image}
					alt={testimonials[testimonialIndex].name}
					class="mx-auto h-12 w-12 flex-shrink-0 rounded-full object-cover sm:mx-0 sm:h-16 sm:w-16"
				/>
				<div class="flex-1 text-center sm:text-left">
					<div class="mb-3 flex justify-center space-x-1 sm:mb-4 sm:justify-start">
						{#each Array(testimonials[testimonialIndex].rating) as _}
							<Star class="h-4 w-4 fill-yellow-400 text-yellow-400 sm:h-5 sm:w-5" />
						{/each}
					</div>
					<p class="mb-3 text-sm text-gray-600 sm:mb-4 sm:text-base">
						{testimonials[testimonialIndex].text}
					</p>
					<div>
						<div class="text-sm font-semibold text-gray-800 sm:text-base">
							{testimonials[testimonialIndex].name}
						</div>
						<div class="text-xs text-gray-600 sm:text-sm">
							{testimonials[testimonialIndex].role}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Testimonial Pagination Dots -->
		<div class="mt-6 flex justify-center space-x-2 sm:mt-8">
			{#each testimonials as _, index}
				<button
					on:click={() => goToTestimonial(index)}
					class="h-2.5 w-2.5 rounded-full transition-colors sm:h-3 sm:w-3 {testimonialIndex ===
					index
						? 'bg-green-500'
						: 'bg-gray-300 hover:bg-gray-400'}"
					aria-label="Go to testimonial {index + 1}"
				></button>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section
	class="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 py-16 text-white sm:py-20"
>
	<div class="absolute inset-0 bg-black opacity-40"></div>
	<div class="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
		<h2 class="mb-4 text-3xl font-bold sm:mb-6 sm:text-5xl">
			Ready to Make Your Dream Property a Reality?
		</h2>
		<p class="mb-6 text-base opacity-90 sm:mb-8 sm:text-xl">
			Join thousands of satisfied customers who found their perfect home through Houserz.
		</p>
		<a
			href="/register"
			class="rounded-lg bg-green-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-600 sm:px-8 sm:py-4 sm:text-lg"
		>
			Get Started Today
		</a>
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

<style>
	/* Custom styles for smooth animations */
	.transition-opacity {
		transition: opacity 1s ease-in-out;
	}
</style>
