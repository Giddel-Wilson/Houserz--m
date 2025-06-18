<script lang="ts">
	import { onMount } from 'svelte';
	import { Star, MapPin, Phone, Mail, MessageCircle, Award, Users, TrendingUp } from 'lucide-svelte';

	let user: any = null;

	onMount(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		}
	});

	const agents = [
		{
			id: 1,
			name: 'John Smith',
			title: 'Senior Real Estate Agent',
			location: 'Lagos, Nigeria',
			image: '/agent-1.jpg',
			rating: 4.9,
			reviews: 156,
			phone: '+234 801 234 5678',
			email: 'john.smith@houserz.com',
			specialization: 'Luxury Properties',
			experience: '8 years',
			propertiesSold: 245,
			verified: true,
			bio: 'Specializing in luxury properties across Lagos with over 8 years of experience. Committed to providing exceptional service and finding the perfect home for every client.'
		},
		{
			id: 2,
			name: 'Sarah Johnson',
			title: 'Property Investment Specialist',
			location: 'Abuja, Nigeria',
			image: '/agent-2.jpg',
			rating: 4.8,
			reviews: 128,
			phone: '+234 802 345 6789',
			email: 'sarah.johnson@houserz.com',
			specialization: 'Investment Properties',
			experience: '6 years',
			propertiesSold: 189,
			verified: true,
			bio: 'Expert in investment properties and commercial real estate. Helping clients build wealth through strategic property investments in Abuja and surrounding areas.'
		},
		{
			id: 3,
			name: 'Michael Brown',
			title: 'Residential Properties Expert',
			location: 'Port Harcourt, Nigeria',
			image: '/agent-3.jpg',
			rating: 4.7,
			reviews: 94,
			phone: '+234 803 456 7890',
			email: 'michael.brown@houserz.com',
			specialization: 'Residential Homes',
			experience: '5 years',
			propertiesSold: 156,
			verified: true,
			bio: 'Passionate about helping families find their dream homes. Extensive knowledge of residential properties in Port Harcourt and the Niger Delta region.'
		},
		{
			id: 4,
			name: 'Emma Wilson',
			title: 'First-Time Buyer Specialist',
			location: 'Ibadan, Nigeria',
			image: '/agent-4.jpg',
			rating: 4.9,
			reviews: 112,
			phone: '+234 804 567 8901',
			email: 'emma.wilson@houserz.com',
			specialization: 'First-Time Buyers',
			experience: '4 years',
			propertiesSold: 134,
			verified: true,
			bio: 'Dedicated to making the home buying process smooth and stress-free for first-time buyers. Patient, knowledgeable, and always available to help.'
		},
		{
			id: 5,
			name: 'David Chen',
			title: 'Commercial Real Estate Agent',
			location: 'Kano, Nigeria',
			image: '/agent-5.jpg',
			rating: 4.8,
			reviews: 87,
			phone: '+234 805 678 9012',
			email: 'david.chen@houserz.com',
			specialization: 'Commercial Properties',
			experience: '7 years',
			propertiesSold: 98,
			verified: true,
			bio: 'Specializing in commercial properties and business real estate. Helping businesses find the perfect location to grow and succeed.'
		},
		{
			id: 6,
			name: 'Grace Okafor',
			title: 'Luxury Homes Consultant',
			location: 'Enugu, Nigeria',
			image: '/agent-6.jpg',
			rating: 4.9,
			reviews: 76,
			phone: '+234 806 789 0123',
			email: 'grace.okafor@houserz.com',
			specialization: 'Luxury Estates',
			experience: '6 years',
			propertiesSold: 123,
			verified: true,
			bio: 'Expert in luxury estates and high-end properties. Providing personalized service for discerning clients seeking premium homes in Enugu.'
		}
	];
</script>

<svelte:head>
	<title>Agents - Houserz</title>
	<meta name="description" content="Connect with verified real estate agents across Nigeria. Expert guidance for your property journey." />
</svelte:head>

<!-- Navigation -->
<nav class="bg-white shadow-sm px-4 py-4 sm:px-6">
	<!-- ...existing navigation code... -->
	<div class="mx-auto flex max-w-7xl items-center justify-between">
		<a href="/" class="text-xl font-bold text-gray-900 sm:text-2xl">Houserz</a>
		<div class="hidden items-center space-x-8 text-gray-700 lg:flex">
			<a href="/" class="transition-colors hover:text-green-500">Home</a>
			<a href="/properties" class="transition-colors hover:text-green-500">Properties</a>
			<a href="/agents" class="text-green-500 font-semibold">Agents</a>
			<a href="/about" class="transition-colors hover:text-green-500">About</a>
			<a href="/contact" class="transition-colors hover:text-green-500">Contact</a>
		</div>
		<!-- ...existing user auth section... -->
	</div>
</nav>

<!-- Hero Section -->
<section class="bg-gradient-to-r from-blue-600 to-blue-800 py-16 text-white sm:py-20">
	<div class="mx-auto max-w-7xl px-4 text-center sm:px-6">
		<h1 class="mb-4 text-3xl font-bold sm:mb-6 sm:text-5xl">Meet Our Expert Agents</h1>
		<p class="mb-8 text-base opacity-90 sm:text-xl">Connect with verified professionals who know the Nigerian real estate market inside and out.</p>
	</div>
</section>

<!-- Stats Section -->
<section class="bg-white py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
			<div class="flex flex-col items-center">
				<div class="mb-4 rounded-full bg-green-100 p-4">
					<Users class="h-8 w-8 text-green-600" />
				</div>
				<h3 class="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">150+</h3>
				<p class="text-gray-600">Verified Agents</p>
			</div>
			<div class="flex flex-col items-center">
				<div class="mb-4 rounded-full bg-blue-100 p-4">
					<Award class="h-8 w-8 text-blue-600" />
				</div>
				<h3 class="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">4.8</h3>
				<p class="text-gray-600">Average Rating</p>
			</div>
			<div class="flex flex-col items-center">
				<div class="mb-4 rounded-full bg-purple-100 p-4">
					<TrendingUp class="h-8 w-8 text-purple-600" />
				</div>
				<h3 class="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">1,200+</h3>
				<p class="text-gray-600">Properties Sold</p>
			</div>
		</div>
	</div>
</section>

<!-- Agents Grid -->
<section class="bg-gray-50 py-12 sm:py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="mb-8">
			<h2 class="text-center text-2xl font-bold text-gray-800 sm:text-3xl">Our Top Agents</h2>
			<p class="mt-4 text-center text-gray-600">Choose from our network of experienced and verified real estate professionals</p>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
			{#each agents as agent}
				<div class="overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-xl">
					<div class="relative h-48 sm:h-56">
						<img src={agent.image} alt={agent.name} class="h-full w-full object-cover" />
						{#if agent.verified}
							<div class="absolute top-3 right-3 rounded-full bg-green-500 p-2">
								<Award class="h-4 w-4 text-white" />
							</div>
						{/if}
					</div>
					<div class="p-6">
						<div class="mb-3 flex items-center justify-between">
							<h3 class="text-lg font-bold text-gray-800 sm:text-xl">{agent.name}</h3>
							<div class="flex items-center space-x-1">
								<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
								<span class="text-sm font-medium text-gray-700">{agent.rating}</span>
							</div>
						</div>
						
						<p class="mb-2 text-sm font-medium text-green-600">{agent.title}</p>
						
						<div class="mb-3 flex items-center text-gray-600">
							<MapPin class="mr-1 h-3 w-3" />
							<span class="text-xs">{agent.location}</span>
						</div>
						
						<p class="mb-4 text-sm text-gray-600 line-clamp-3">{agent.bio}</p>
						
						<div class="mb-4 grid grid-cols-2 gap-4 text-center">
							<div>
								<p class="text-lg font-bold text-gray-800">{agent.propertiesSold}</p>
								<p class="text-xs text-gray-600">Properties Sold</p>
							</div>
							<div>
								<p class="text-lg font-bold text-gray-800">{agent.reviews}</p>
								<p class="text-xs text-gray-600">Reviews</p>
							</div>
						</div>
						
						<div class="mb-4 text-sm text-gray-600">
							<p><strong>Specialization:</strong> {agent.specialization}</p>
							<p><strong>Experience:</strong> {agent.experience}</p>
						</div>
						
						<div class="space-y-2">
							<button class="w-full rounded-lg bg-green-500 py-2 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-600">
								View Profile
							</button>
							<div class="flex space-x-2">
								<a href="tel:{agent.phone}" class="flex-1 rounded-lg border border-gray-300 py-2 px-3 text-center text-sm text-gray-700 transition-colors hover:bg-gray-50">
									<Phone class="mx-auto h-4 w-4" />
								</a>
								<a href="mailto:{agent.email}" class="flex-1 rounded-lg border border-gray-300 py-2 px-3 text-center text-sm text-gray-700 transition-colors hover:bg-gray-50">
									<Mail class="mx-auto h-4 w-4" />
								</a>
								<button class="flex-1 rounded-lg border border-gray-300 py-2 px-3 text-center text-sm text-gray-700 transition-colors hover:bg-gray-50">
									<MessageCircle class="mx-auto h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Become an Agent CTA -->
<section class="bg-blue-600 py-16 text-white sm:py-20">
	<div class="mx-auto max-w-4xl px-4 text-center sm:px-6">
		<h2 class="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">Join Our Network of Agents</h2>
		<p class="mb-6 text-base opacity-90 sm:mb-8 sm:text-xl">Are you a licensed real estate professional? Join Houserz and expand your reach to more clients.</p>
		<a href="/register" class="rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-600 transition-colors hover:bg-gray-100 sm:px-8 sm:py-4 sm:text-lg">
			Become an Agent
		</a>
	</div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 py-12 text-white sm:py-16">
	<!-- ...existing footer code... -->
</footer>
