<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		Calendar, Clock, MapPin, Phone, MessageSquare, 
		Eye, User, Building2, Check, X, AlertCircle,
		ArrowLeft, FileText, Filter
	} from 'lucide-svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	interface Viewing {
		id: number;
		property_id: number;
		scheduled_date: string;
		scheduled_time: string;
		status: string;
		user_message: string;
		user_phone: string;
		agent_notes: string;
		user_name: string;
		user_email: string;
		property_title: string;
		property_location: string;
		property_price: string;
		property_type: string;
		property_image: string;
		created_at: string;
	}

	let agent: any = null;
	let viewings: Viewing[] = [];
	let loading = true;
	let error = '';
	let selectedStatus = 'all';
	let selectedViewing: Viewing | null = null;
	let showNotesModal = false;
	let newNotes = '';
	let updatingStatus = false;

	const statusOptions = [
		{ value: 'all', label: 'All Requests' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'confirmed', label: 'Confirmed' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	const statusColors = {
		pending: 'bg-yellow-100 text-yellow-800',
		confirmed: 'bg-green-100 text-green-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};

	onMount(() => {
		// Get user data from localStorage (authentication handled by layout)
		const userData = localStorage.getItem('user');
		if (userData) {
			agent = JSON.parse(userData);
		}
		
		loadViewings();
	});

	async function loadViewings() {
		try {
			loading = true;
			const token = localStorage.getItem('houserz_token');

			const params = new URLSearchParams();
			if (selectedStatus !== 'all') {
				params.append('status', selectedStatus);
			}

			const response = await fetch(`/api/agent/viewings?${params}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const result = await response.json();

			if (response.ok && result.success) {
				viewings = result.viewings;
			} else {
				error = result.error || 'Failed to load viewing requests';
			}
		} catch (err) {
			console.error('Error loading viewings:', err);
			error = 'Failed to load viewing requests';
		} finally {
			loading = false;
		}
	}

	async function updateViewingStatus(viewingId: number, status: string) {
		if (!confirm(`Are you sure you want to ${status === 'confirmed' ? 'confirm' : status === 'cancelled' ? 'cancel' : 'update'} this viewing?`)) {
			return;
		}

		try {
			updatingStatus = true;
			const token = localStorage.getItem('houserz_token');

			const response = await fetch('/api/agent/viewings', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					viewingId,
					action: 'update_status',
					status
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Reload viewings
				await loadViewings();
			} else {
				error = result.error || 'Failed to update viewing status';
			}
		} catch (err) {
			console.error('Error updating viewing status:', err);
			error = 'Failed to update viewing status';
		} finally {
			updatingStatus = false;
		}
	}

	async function saveNotes() {
		if (!selectedViewing) return;

		try {
			const token = localStorage.getItem('houserz_token');

			const response = await fetch('/api/agent/viewings', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					viewingId: selectedViewing.id,
					action: 'add_notes',
					notes: newNotes
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Update the viewing in the list
				viewings = viewings.map(v => 
					v.id === selectedViewing.id 
						? { ...v, agent_notes: newNotes }
						: v
				);
				
				showNotesModal = false;
				selectedViewing = null;
				newNotes = '';
			} else {
				error = result.error || 'Failed to save notes';
			}
		} catch (err) {
			console.error('Error saving notes:', err);
			error = 'Failed to save notes';
		}
	}

	function openNotesModal(viewing: Viewing) {
		selectedViewing = viewing;
		newNotes = viewing.agent_notes || '';
		showNotesModal = true;
	}

	function closeNotesModal() {
		showNotesModal = false;
		selectedViewing = null;
		newNotes = '';
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	function formatTime(timeStr: string) {
		const [hours, minutes] = timeStr.split(':');
		const date = new Date();
		date.setHours(parseInt(hours), parseInt(minutes));
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		});
	}

	function formatPrice(price: string) {
		const numPrice = parseFloat(price);
		return `₦${numPrice.toLocaleString()}`;
	}

	function isUpcoming(dateStr: string, timeStr: string) {
		const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
		return scheduledDateTime > new Date();
	}

	$: filteredViewings = viewings;

	// Reactive statement to reload viewings when status filter changes
	$: selectedStatus, loadViewings();
</script>

<svelte:head>
	<title>Viewing Requests - Houserz Agent</title>
</svelte:head>

<div class="flex flex-col h-full max-w-7xl mx-auto p-4 lg:p-6 pt-5">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center mb-4">
			<a href="/agent" class="text-green-600 hover:text-green-800 mr-3">
				<ArrowLeft class="w-5 h-5" />
			</a>
			<h1 class="text-2xl lg:text-3xl font-bold text-gray-900 ml-4 lg:ml-0">Viewing Requests</h1>
		</div>
		<p class="text-gray-600">Manage property viewing requests from potential buyers and renters</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}

	<!-- Status Filter -->
	<div class="mb-6">
		<div class="flex flex-wrap gap-2">
			{#each statusOptions as option}
				<button
					on:click={() => selectedStatus = option.value}
					class="px-3 py-2 lg:px-4 rounded-lg text-sm font-medium transition-colors {
						selectedStatus === option.value
							? 'bg-green-600 text-white'
							: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
					}"
				>
					<Filter class="w-4 h-4 inline mr-1" />
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
			<span class="ml-2 text-gray-600">Loading viewing requests...</span>
		</div>
	{:else if filteredViewings.length === 0}
		<!-- Empty State -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
			<Calendar class="w-16 h-16 text-gray-400 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-gray-900 mb-2">No viewing requests</h3>
			<p class="text-gray-500 mb-6">
				{selectedStatus === 'all' 
					? "You haven't received any property viewing requests yet" 
					: `No ${selectedStatus} viewing requests found`}
			</p>
			<a 
				href="/agent/properties" 
				class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
			>
				Manage Properties
			</a>
		</div>
	{:else}
		<!-- Viewings List -->
		<div class="flex-1 overflow-y-auto space-y-4 lg:space-y-6">
			{#each filteredViewings as viewing}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
					<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<!-- Viewing Info -->
						<div class="flex-1">
							<div class="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
								<!-- Property Image -->
								<div class="flex-shrink-0">
									<img
										src={viewing.property_image || '/placeholder-property.jpg'}
										alt={viewing.property_title}
										class="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-lg"
									/>
								</div>

								<!-- Details -->
								<div class="flex-1 min-w-0">
									<!-- Status Badge -->
									<div class="flex flex-wrap items-center gap-2 mb-2">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusColors[viewing.status]}">
											{viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
										</span>
										{#if isUpcoming(viewing.scheduled_date, viewing.scheduled_time) && viewing.status === 'confirmed'}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
												Upcoming
											</span>
										{/if}
									</div>

									<!-- Property Title -->
									<h3 class="text-lg font-semibold text-gray-900 mb-1 truncate">
										{viewing.property_title}
									</h3>

									<!-- User Info -->
									<div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 mb-3 space-y-1 sm:space-y-0">
										<div class="flex items-center">
											<User class="w-4 h-4 mr-1" />
											<span class="font-medium">{viewing.user_name}</span>
										</div>
										<div class="flex items-center">
											<Phone class="w-4 h-4 mr-1" />
											<span>{viewing.user_phone}</span>
										</div>
									</div>

									<!-- Viewing Details -->
									<div class="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 text-sm">
										<div class="flex items-center text-gray-600">
											<Calendar class="w-4 h-4 mr-2" />
											<span class="truncate">{formatDate(viewing.scheduled_date)}</span>
										</div>
										<div class="flex items-center text-gray-600">
											<Clock class="w-4 h-4 mr-2" />
											<span>{formatTime(viewing.scheduled_time)}</span>
										</div>
										<div class="flex items-center text-gray-600">
											<MapPin class="w-4 h-4 mr-2" />
											<span class="truncate">{viewing.property_location}</span>
										</div>
										<div class="flex items-center text-gray-600">
											<Building2 class="w-4 h-4 mr-2" />
											<span class="font-medium text-green-600">{formatPrice(viewing.property_price)}</span>
										</div>
									</div>

									<!-- User Message -->
									{#if viewing.user_message}
										<div class="mt-3 p-3 bg-gray-50 rounded-lg">
											<div class="flex items-start">
												<MessageSquare class="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
												<p class="text-sm text-gray-700">{viewing.user_message}</p>
											</div>
										</div>
									{/if}

									<!-- Agent Notes -->
									{#if viewing.agent_notes}
										<div class="mt-3 p-3 bg-green-50 rounded-lg">
											<div class="flex items-start">
												<FileText class="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
												<div>
													<p class="text-sm font-medium text-green-900 mb-1">Your Notes:</p>
													<p class="text-sm text-green-700">{viewing.agent_notes}</p>
												</div>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2 lg:w-48">
							<a 
								href="/agent/properties/{viewing.property_id}"
								class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-center flex items-center justify-center"
							>
								<Eye class="w-4 h-4 mr-1" />
								View Property
							</a>

							{#if viewing.status === 'pending'}
								<button
									on:click={() => updateViewingStatus(viewing.id, 'confirmed')}
									disabled={updatingStatus}
									class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
								>
									<Check class="w-4 h-4 mr-1" />
									Confirm
								</button>
								<button
									on:click={() => updateViewingStatus(viewing.id, 'cancelled')}
									disabled={updatingStatus}
									class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
								>
									<X class="w-4 h-4 mr-1" />
									Decline
								</button>
							{:else if viewing.status === 'confirmed'}
								<button
									on:click={() => updateViewingStatus(viewing.id, 'completed')}
									disabled={updatingStatus}
									class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
								>
									<Check class="w-4 h-4 mr-1" />
									Mark Complete
								</button>
							{/if}

							<button
								on:click={() => openNotesModal(viewing)}
								class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors text-sm flex items-center justify-center"
							>
								<FileText class="w-4 h-4 mr-1" />
								{viewing.agent_notes ? 'Edit Notes' : 'Add Notes'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Notes Modal -->
{#if showNotesModal && selectedViewing}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
				<div>
					<h3 class="text-lg font-semibold text-gray-900">
						{selectedViewing.agent_notes ? 'Edit Notes' : 'Add Notes'}
					</h3>
					<p class="text-sm text-gray-600 mt-1">
						For viewing with {selectedViewing.user_name}
					</p>
				</div>
				<button 
					on:click={closeNotesModal}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<X class="w-6 h-6" />
				</button>
			</div>

			<!-- Modal Content -->
			<div class="p-6 flex-1 overflow-y-auto">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Notes
				</label>
				<textarea
					bind:value={newNotes}
					rows="4"
					placeholder="Add any notes about this viewing request..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 resize-none"
				></textarea>
			</div>

			<!-- Modal Actions -->
			<div class="flex space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
				<button
					on:click={closeNotesModal}
					class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
				>
					Cancel
				</button>
				<button
					on:click={saveNotes}
					class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
				>
					Save Notes
				</button>
			</div>
		</div>
	</div>
{/if}
