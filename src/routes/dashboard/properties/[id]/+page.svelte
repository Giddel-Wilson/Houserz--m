<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		ArrowLeft, 
		Heart, 
		Share2, 
		ChevronLeft, 
		ChevronRight, 
		Home, 
		MapPin, 
		Bath, 
		Bed, 
		Maximize, 
		Eye,
		Badge,
		Building,
		Phone,
		Mail,
		Menu,
		X,
		MessageSquare,
		Settings,
		User,
		Calendar,
		LogOut,
		Search,
		Square
	} from 'lucide-svelte';

	// Default variables
	let property: any = null;
	let loading = true;
	let error = '';
	let user: any = null;
	let profile: any = {}; // Add this line to create the profile object
	let currentPage = 'property-details';
	let sidebarOpen = false;
	let currentImageIndex = 0;
	let isSaving = false;
	let data: any = {}; // Add data variable for SSR data

	// Dashboard data
	let savedProperties: any[] = [];
	let viewingRequests: any[] = [];
	let messages: any[] = [];

	// Modal states
	let showScheduleModal = false;
	let showContactModal = false;
	let submittingViewing = false;
	let submittingContact = false;

	// Form data
	let viewingDate = '';
	let viewingTime = '';
	let contactMessage = '';
	let existingConversation: any = null;

	// Get property id from URL params
	$: propertyId = $page.params.id;

	// Utility functions
	function formatPrice(price) {
		if (!price) return 'Price on request';
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			maximumFractionDigits: 0
		}).format(price);
	}
	
	function formatFeatures(features) {
		if (!features) return [];
		if (Array.isArray(features)) return features;
		try {
			// Sometimes features might be a JSON string
			return typeof features === 'string' ? JSON.parse(features) : [];
		} catch (e) {
			console.error('Error parsing features:', e);
			return [];
		}
	}

	onMount(() => {
		console.log('Property detail page mounted, propertyId:', propertyId);
		console.log('Initial data:', data);
		
		const userData = localStorage.getItem('user');
		console.log('User data from localStorage:', userData ? 'Found' : 'Not found');
		
		if (!userData) {
			console.log('No user data found, redirecting to login');
			goto('/login');
			return;
		}
		
		try {
			user = JSON.parse(userData);
			console.log('User role:', user.role);
			
			// Less restrictive role check - accept any case of client/buyer role
			// and also check against CLIENT in uppercase (from database)
			const userRole = user.role?.toLowerCase();
			if (userRole !== 'client' && userRole !== 'buyer' && userRole !== 'CLIENT') {
				console.log('Invalid user role for this page:', user.role);
				// Don't redirect - the dashboard layout already handles role-based redirects
			}

			// Check if we have prefetched property data from the server
			if (data && data.property) {
				console.log('Using prefetched property data from server');
				property = data.property;
				loading = false;
			} else {
				// Fetch fresh property data from the API
				console.log('No prefetched data, fetching property from API');
				loadProperty();
			}
		} catch (error) {
			console.error('Error processing user data:', error);
			goto('/login');
			return;
		}

		loadDashboardData();
	});

	async function loadProperty() {
		try {
			loading = true;
			error = '';
			
			console.log(`Loading property ID: ${propertyId}`);
			const token = localStorage.getItem('token');
			
			if (!token) {
				console.error('No auth token available');
				error = 'Authentication required';
				goto('/login');
				return;
			}
			
			// Inject a small timeout to ensure the API is ready
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const apiUrl = `/api/properties/${propertyId}`;
			console.log('Fetching property data from API:', apiUrl);
			
			// Try direct fetch without auth headers first, as a fallback
			try {
				const response = await fetch(apiUrl, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					cache: 'no-store' // Prevent caching issues
				});
				
				console.log('API response status:', response.status);
				
				if (response.ok) {
					const data = await response.json();
					console.log('API response data received:', data ? Object.keys(data) : 'No data');
					
					if (data && data.property) {
						console.log('Property data loaded successfully:', data.property.id);
						property = data.property;
						loading = false; // Set loading to false immediately on success
						return; // Exit early on success
					} else {
						console.error('Property data missing from response');
						throw new Error('Property data missing from response');
					}
				} else {
					let errorMessage = `Error ${response.status}`;
					try {
						const errorData = await response.json();
						console.error('Failed to load property:', response.status, errorData);
						errorMessage = errorData.error || `Failed to load property: ${response.status}`;
					} catch (parseErr) {
						console.error('Failed to parse error response:', parseErr);
					}
					throw new Error(errorMessage);
				}
			} catch (fetchError) {
				console.error('Initial fetch failed, trying without auth:', fetchError);
				
				// Try again without auth token as fallback
				const publicResponse = await fetch(apiUrl, {
					cache: 'no-store'
				});
				
				if (publicResponse.ok) {
					const data = await publicResponse.json();
					if (data && data.property) {
						console.log('Property loaded successfully through public API');
						property = data.property;
						return;
					}
				}
				
				// If we get here, both attempts failed
				throw fetchError;
			}
		} catch (err) {
			console.error('Error loading property:', err);
			error = err instanceof Error ? err.message : 'Failed to load property details';
			
			// Add a retry button message if all attempts fail
			if (!property) {
				error += ' - Please try refreshing the page.';
			}
		} finally {
			loading = false;
		}
	}

	async function loadDashboardData() {
		try {
			const token = localStorage.getItem('token');
			
			// Load user favorites
			const favResponse = await fetch('/api/user/favorites', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (favResponse.ok) {
				const favData = await favResponse.json();
				savedProperties = favData.favorites.slice(0, 3);
			}

			// Load viewing requests
			const viewingResponse = await fetch('/api/user/viewings', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (viewingResponse.ok) {
				const viewingData = await viewingResponse.json();
				viewingRequests = viewingData.viewings || [];
			}

			// Load messages count
			messages = [];
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		}
	}

	async function toggleSave() {
		if (!property) return;
		
		try {
			isSaving = true;
			const token = localStorage.getItem('token');
			
			if (property.isSaved) {
				// Remove from favorites
				const response = await fetch(`/api/user/favorites/${property.id}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				
				if (response.ok) {
					property.isSaved = false;
					await loadDashboardData();
				}
			} else {
				// Add to favorites
				const response = await fetch('/api/user/favorites', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ property_id: property.id })
				});
				
				if (response.ok) {
					property.isSaved = true;
					await loadDashboardData();
				}
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
		} finally {
			isSaving = false;
		}
	}

	async function scheduleViewing() {
		if (!viewingDate || !viewingTime) {
			alert('Please select both date and time');
			return;
		}

		try {
			submittingViewing = true;
			const token = localStorage.getItem('token');
			
			const response = await fetch('/api/user/viewings', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					property_id: property.id,
					preferred_date: viewingDate,
					preferred_time: viewingTime
				})
			});

			if (response.ok) {
				alert('Viewing request submitted successfully!');
				showScheduleModal = false;
				viewingDate = '';
				viewingTime = '';
				await loadDashboardData();
			} else {
				const errorData = await response.json();
				alert(errorData.error || 'Failed to schedule viewing');
			}
		} catch (error) {
			console.error('Error scheduling viewing:', error);
			alert('Failed to schedule viewing');
		} finally {
			submittingViewing = false;
		}
	}

	// Check for existing conversation with the agent
	async function checkExistingConversation() {
		if (!property?.agent?.id) return null;
		
		try {
			const token = localStorage.getItem('token');
			if (!token) return null;
			
			const response = await fetch(`/api/user/conversations?property_id=${property.id}&agent_id=${property.agent.id}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				return data.conversation || null;
			}
		} catch (error) {
			console.error('Error checking existing conversation:', error);
		}
		
		return null;
	}

	async function contactAgent() {
		if (!contactMessage.trim()) {
			alert('Please enter a message');
			return;
		}
		
		if (!property || !property.agent || !property.agent.id) {
			alert('Agent information is not available for this property');
			return;
		}

		try {
			submittingContact = true;
			console.log('Contacting agent:', property.agent.id, 'about property:', property.id);
			
			// Add info about whether we're continuing a conversation
			const continuingConversation = !!existingConversation;
			console.log('Continuing conversation:', continuingConversation, 
						existingConversation ? `ID: ${existingConversation.id}` : '');
			
			// Prepare message with property information
			let enhancedMessage = contactMessage;
			
			// If this is a new conversation, include the property location and price to make it 
			// easier for the agent to identify which property the message is about
			if (!continuingConversation) {
				const propertyLocation = property.city ? 
					(property.state ? `${property.city}, ${property.state}` : property.city) : 
					(property.state || '');
					
				const propertyPrice = property.price ? 
					`₦${property.price.toLocaleString()}` : 
					'Price not specified';
					
				enhancedMessage = `Inquiry about: ${property.title}\nLocation: ${propertyLocation}\nPrice: ${propertyPrice}\n\n${contactMessage}`;
			}
			
			const token = localStorage.getItem('token');
			
			if (!token) {
				throw new Error('Authentication token not found. Please log in again.');
			}
			
			const messageData = {
				message: enhancedMessage,
				property_id: property.id,
				recipient_id: property.agent.id
			};
			
			// The API handles both new and existing conversations automatically
			// based on the user, recipient, and property combination
			console.log('Sending message data:', messageData);
			
			const response = await fetch('/api/user/messages', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(messageData)
			});
			
			console.log('Response status:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('Message sent successfully:', data);
				showContactModal = false;
				contactMessage = '';
				
				// Show success message
				const successMessage = continuingConversation ? 
					'Reply sent successfully!' : 
					'Message sent successfully! The agent will get back to you soon.';
				
				alert(successMessage);
				
				// Optional: You could also add a toast notification here
				// or update a success state to show a banner
			} else {
				let errorMessage = 'Failed to send message';
				try {
					const errorData = await response.json();
					console.error('API Error:', response.status, errorData);
					errorMessage = errorData.error || errorMessage;
				} catch (parseError) {
					console.error('Failed to parse error response:', parseError);
					errorMessage = `Server error (${response.status})`;
				}
				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error('Error sending message:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
			alert(errorMessage);
		} finally {
			submittingContact = false;
		}
	}

	function goBack() {
		goto('/dashboard/properties');
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		goto('/');
	}
</script>

<svelte:head>
	<title>{property ? property.title : 'Property Details'} - Houserz</title>
</svelte:head>

	<div class="flex h-screen">
		<!-- Sidebar -->
		<div
			class="
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
			fixed
			z-40 h-full
			w-64 bg-white shadow-lg transition-transform
			duration-300 ease-in-out
			md:w-[50%] lg:static lg:w-64
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
					<nav class="flex-1 px-2 py-4 flex flex-col space-y-4">
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
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {currentPage === 'properties' || currentPage === 'property-details' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}"
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

		<!-- Sidebar Overlay -->
		{#if sidebarOpen}
			<div
				class="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
				on:click={closeSidebar}
			></div>
		{/if}

		<!-- Main Content -->
		<div class="flex-1 lg:ml-0 overflow-y-auto py-8">
			<div class="container mx-auto px-4">
				<!-- Header with Menu Toggle -->
				<div class="flex items-center justify-between mb-6">
					<button on:click={goBack} class="flex items-center text-gray-600 hover:text-gray-900">
						<ArrowLeft class="w-4 h-4 mr-2" />
						Back to Properties
					</button>
					
					<button
						on:click={() => sidebarOpen = !sidebarOpen}
						class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
					>
						{#if sidebarOpen}
							<X class="h-6 w-6" />
						{:else}
							<Menu class="h-6 w-6" />
						{/if}
					</button>
				</div>

		<div class="flex flex-col lg:flex-row gap-6">
			<!-- Main Content -->
			<div class="flex-1">
				{#if loading}
					<div class="flex flex-col justify-center items-center py-16">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
						<span class="ml-3 text-gray-600 my-3">Loading property details...</span>
						<p class="text-sm text-gray-500">Property ID: {propertyId}</p>
					</div>
				{:else if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						<div class="flex justify-between items-center mb-2">
							<span class="font-semibold">Error Loading Property</span>
							<button 
								class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm transition-colors"
								on:click={loadProperty}
							>
								Retry
							</button>
						</div>
						<p>{error}</p>
					</div>
					
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold mb-4">Property Details</h2>
						<p class="mb-3">Unable to load property details. The property might not exist or you might not have permission to view it.</p>
						<p class="mb-3">Property ID: {propertyId}</p>
						
						<div class="mt-6">
							<a href="/dashboard/properties" class="inline-flex items-center text-green-600 hover:text-green-800">
								<ArrowLeft class="w-4 h-4 mr-1" />
								Back to Properties
							</a>
						</div>
					</div>
				{:else if property}
					<!-- Property Gallery -->
					<div class="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
						{#if property.images && property.images.length > 0}
							<!-- Main Image -->
							<div class="relative">
								<img 
									src={property.images[currentImageIndex].image_url || property.images[currentImageIndex].imageUrl} 
									alt={property.title}
									class="w-full h-64 md:h-96 object-cover"
								/>
								
								<button
									on:click={toggleSave}
									class="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
								>
									<Heart class="w-5 h-5 {property.isSaved ? 'text-red-500 fill-current' : 'text-gray-400'}" />
								</button>

								<!-- Navigation arrows for multiple images -->
								{#if property.images.length > 1}
									<button
										on:click={() => currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : property.images.length - 1}
										class="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-all"
									>
										<ChevronLeft class="w-5 h-5 text-gray-700" />
									</button>
									<button
										on:click={() => currentImageIndex = currentImageIndex < property.images.length - 1 ? currentImageIndex + 1 : 0}
										class="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-all"
									>
										<ChevronRight class="w-5 h-5 text-gray-700" />
									</button>
									
									<!-- Image counter -->
									<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
										{currentImageIndex + 1} / {property.images.length}
									</div>
								{/if}
							</div>

							<!-- Image Thumbnails Grid -->
							{#if property.images.length > 1}
								<div class="p-4 border-t border-gray-100">
									<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
										{#each property.images as image, index}
											<button
												on:click={() => currentImageIndex = index}
												class="relative aspect-square rounded-lg overflow-hidden border-2 transition-all {currentImageIndex === index ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}"
											>
												<img
													src={image.image_url || image.imageUrl}
													alt={`${property.title} - Image ${index + 1}`}
													class="w-full h-full object-cover"
												/>
												{#if currentImageIndex === index}
													<div class="absolute inset-0 bg-green-500/20"></div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<div class="relative">
								<div class="w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center">
									<div class="text-center">
										<div class="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
											<Home class="w-8 h-8 text-gray-400" />
										</div>
										<span class="text-gray-500">No images available</span>
									</div>
								</div>
								
								<button
									on:click={toggleSave}
									class="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
								>
									<Heart class="w-5 h-5 {property.isSaved ? 'text-red-500 fill-current' : 'text-gray-400'}" />
								</button>
							</div>
						{/if}
						
						<div class="p-6">
							<div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
								<h1 class="text-2xl md:text-3xl font-bold text-gray-900">{property?.title || 'Property Details'}</h1>
								<div class="text-right">
									<p class="text-3xl font-bold text-green-600">{formatPrice(property.price)}</p>
									<p class="text-sm text-gray-500 capitalize">{property.listingType}</p>
								</div>
							</div>
							
							<div class="flex items-center text-gray-600 mb-4">
								<MapPin class="w-5 h-5 mr-2 flex-shrink-0" />
								<span>{property.location}</span>
							</div>

							<!-- Property Stats -->
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
								<div class="text-center">
									<div class="flex items-center justify-center mb-1">
										<Bed class="w-5 h-5 text-gray-600" />
									</div>
									<p class="text-lg font-semibold text-gray-900">{property.bedrooms || 0}</p>
									<p class="text-xs text-gray-500">Bedrooms</p>
								</div>
								<div class="text-center">
									<div class="flex items-center justify-center mb-1">
										<Bath class="w-5 h-5 text-gray-600" />
									</div>
									<p class="text-lg font-semibold text-gray-900">{property.bathrooms || 0}</p>
									<p class="text-xs text-gray-500">Bathrooms</p>
								</div>
								<div class="text-center">
									<div class="flex items-center justify-center mb-1">
										<Square class="w-5 h-5 text-gray-600" />
									</div>
									<p class="text-lg font-semibold text-gray-900">{property.sqft || 0}</p>
									<p class="text-xs text-gray-500">Square Feet</p>
								</div>
								<div class="text-center">
									<div class="flex items-center justify-center mb-1">
										<Eye class="w-5 h-5 text-gray-600" />
									</div>
									<p class="text-lg font-semibold text-gray-900">{property.viewsCount || 0}</p>
									<p class="text-xs text-gray-500">Views</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Description -->
					{#if property.description}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3">Description</h3>
							<p class="text-gray-600 leading-relaxed">{property.description}</p>
						</div>
					{/if}

					<!-- Property Details -->
					<div class="grid md:grid-cols-2 gap-6 mb-6">
						<div>
							<h3 class="text-lg font-semibold text-gray-900 mb-3">Property Details</h3>
							<div class="space-y-2">
								<div class="flex justify-between">
									<span class="text-gray-600">Property Type</span>
									<span class="font-medium text-gray-900">{property.propertyType || 'Not specified'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Year Built</span>
									<span class="font-medium text-gray-900">{property.yearBuilt || 'Not specified'}</span>
								</div>
								{#if property.lotSize}
									<div class="flex justify-between">
										<span class="text-gray-600">Lot Size</span>
										<span class="font-medium text-gray-900">{property.lotSize} sq ft</span>
									</div>
								{/if}
								<div class="flex justify-between">
									<span class="text-gray-600">Status</span>
									<span class="font-medium text-green-600 capitalize">{property.status}</span>
								</div>
							</div>
						</div>

						<div>
							<h3 class="text-lg font-semibold text-gray-900 mb-3">Location Details</h3>
							<div class="space-y-2">
								<div class="flex justify-between">
									<span class="text-gray-600">City</span>
									<span class="font-medium text-gray-900">{property.city || 'N/A'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">State</span>
									<span class="font-medium text-gray-900">{property.state || 'N/A'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Neighborhood</span>
									<span class="font-medium text-gray-900">{property.neighborhood || 'Not specified'}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Features -->
					{#if property.features && formatFeatures(property.features).length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3">Features & Amenities</h3>
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
								{#each formatFeatures(property.features) as feature}
									<div class="flex items-center space-x-2 text-gray-600">
										<div class="w-2 h-2 bg-green-500 rounded-full"></div>
										<span>{feature}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Agent Information -->
					{#if property.agent}
						<div class="border-t pt-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Contact Agent</h3>
							<div class="bg-gray-50 rounded-lg p-4">
								<div class="flex items-start space-x-4">
									<div class="flex-shrink-0">
										<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
											<span class="text-white font-semibold">
												{property.agent.fullName?.charAt(0) || property.agent.name?.charAt(0) || 'A'}
											</span>
										</div>
									</div>
									<div class="flex-1">
										<div class="flex items-center space-x-2 mb-1">
											<h4 class="font-semibold text-gray-900">
												{property.agent.fullName || property.agent.name || 'Unknown Agent'}
											</h4>
											{#if property.agent.isVerified}
												<Badge class="w-4 h-4 text-green-500" />
											{/if}
										</div>
										{#if property.agent.company}
											<p class="text-sm text-gray-600 mb-2 flex items-center">
												<Building class="w-4 h-4 mr-1" />
												{property.agent.company}
											</p>
										{/if}
										{#if property.agent.specialization}
											<p class="text-sm text-gray-600 mb-2">{property.agent.specialization}</p>
										{/if}
										{#if property.agent.bio}
											<p class="text-sm text-gray-600 mb-3">{property.agent.bio}</p>
										{/if}
										<div class="flex space-x-4">
											{#if property.agent.phone}
												<a
													href="tel:{property.agent.phone}"
													class="flex items-center text-green-600 hover:text-green-700 transition-colors"
												>
													<Phone class="w-4 h-4 mr-1" />
													<span class="text-sm">{property.agent.phone}</span>
												</a>
											{/if}
											{#if property.agent.email}
												<a
													href="mailto:{property.agent.email}"
													class="flex items-center text-green-600 hover:text-green-700 transition-colors"
												>
													<Mail class="w-4 h-4 mr-1" />
													<span class="text-sm">{property.agent.email}</span>
												</a>
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="border-t pt-6 mt-6">
						<div class="flex flex-col sm:flex-row gap-4">
							<button
								on:click={async () => {
									existingConversation = await checkExistingConversation();
									showContactModal = true;
								}}
								class="flex-1 border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors font-medium"
							>
								Contact Agent
							</button>
						</div>
					</div>
				{:else}
					<div class="text-center py-12">
				<div class="bg-white rounded-xl p-8 shadow-sm">
					<h3 class="text-lg font-medium text-gray-900 mb-2">No Property Data</h3>
					<p class="text-sm text-gray-500 mb-4">Unable to display property information. This could be due to missing data or an unexpected error.</p>
					<button
						on:click={() => goto('/dashboard/properties')}
						class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
					>
						Back to Properties
					</button>
				</div>
			</div>
		{/if}
		</div>
	</div>
	</div>
	</div>
</div>

<!-- Schedule Viewing Modal -->
{#if showScheduleModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Schedule a Viewing</h3>
			
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
				<input
					type="date"
					bind:value={viewingDate}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
				/>
			</div>
			
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
				<input
					type="time"
					bind:value={viewingTime}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
				/>
			</div>
			
			<div class="flex space-x-3 mt-4">
				<button
					on:click={() => showScheduleModal = false}
					class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={scheduleViewing}
					disabled={submittingViewing}
					class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
				>
					{submittingViewing ? 'Scheduling...' : 'Confirm Viewing'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Contact Agent Modal -->
{#if showContactModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Contact Agent</h3>
			
			{#if existingConversation}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
					<p class="text-sm text-blue-800">
						<span class="font-semibold">Continuing conversation:</span> 
						{existingConversation.subject || 'About this property'}
					</p>
					
					{#if existingConversation.lastMessage}
						<p class="text-xs text-blue-600 mt-1">
							Last message: "{existingConversation.lastMessage.content?.substring(0, 50)}..."
						</p>
					{/if}
				</div>
			{/if}
			
			<p class="text-sm text-gray-600 mb-6">Send a message to {property?.agent?.fullName || property?.agent?.name || 'the agent'}</p>
			
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
				<textarea
					bind:value={contactMessage}
					rows="4"
					placeholder={existingConversation ? 'Continue your conversation...' : "I'm interested in this property and would like to know more..."}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 resize-none"
				></textarea>
			</div>
			
			<div class="flex space-x-3 mt-6">
				<button
					on:click={() => showContactModal = false}
					class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={contactAgent}
					disabled={submittingContact}
					class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
				>
					{submittingContact ? 'Sending...' : existingConversation ? 'Reply' : 'Send Message'}
				</button>
			</div>
		</div>
	</div>
{/if}
