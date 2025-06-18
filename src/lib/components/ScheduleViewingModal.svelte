<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Calendar, Clock, Phone, MessageSquare, X } from 'lucide-svelte';

	export let property: any;
	export let user: any;
	export let show = false;

	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let success = false;

	// Form fields
	let selectedDate = '';
	let selectedTime = '';
	let message = '';
	let phone = '';

	// Generate time slots (9 AM to 6 PM in 1-hour intervals)
	const timeSlots = [
		'09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
	];

	// Get minimum date (tomorrow)
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const minDate = tomorrow.toISOString().split('T')[0];

	// Get maximum date (30 days from now)
	const maxDate = new Date();
	maxDate.setDate(maxDate.getDate() + 30);
	const maxDateStr = maxDate.toISOString().split('T')[0];

	function closeModal() {
		show = false;
		dispatch('close');
		resetForm();
	}

	function resetForm() {
		selectedDate = '';
		selectedTime = '';
		message = '';
		phone = '';
		error = '';
		success = false;
		loading = false;
	}

	async function submitViewing() {
		if (!selectedDate || !selectedTime || !phone) {
			error = 'Please fill in all required fields';
			return;
		}

		// Validate phone number (basic validation)
		const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
		if (!phoneRegex.test(phone)) {
			error = 'Please enter a valid phone number';
			return;
		}

		try {
			loading = true;
			error = '';

			const token = localStorage.getItem('houserz_token');
			
			const response = await fetch(`/api/properties/${property.id}/schedule`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					date: selectedDate,
					time: selectedTime,
					message: message.trim(),
					phone: phone.trim()
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				success = true;
				dispatch('scheduled', result.viewing);
				
				// Close modal after 2 seconds
				setTimeout(() => {
					closeModal();
				}, 2000);
			} else {
				error = result.error || 'Failed to schedule viewing';
			}
		} catch (err) {
			console.error('Error scheduling viewing:', err);
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Format date for display
	function formatDateDisplay(dateStr: string) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	// Format time for display
	function formatTimeDisplay(timeStr: string) {
		if (!timeStr) return '';
		const [hours, minutes] = timeStr.split(':');
		const date = new Date();
		date.setHours(parseInt(hours), parseInt(minutes));
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		});
	}
</script>

{#if show}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">Schedule Property Viewing</h2>
						<p class="text-sm text-gray-600 mt-1">{property?.title}</p>
					</div>
					<button 
						on:click={closeModal}
						class="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X class="w-6 h-6" />
					</button>
				</div>
			</div>

			{#if success}
				<!-- Success State -->
				<div class="p-6 text-center">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar class="w-8 h-8 text-green-600" />
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Viewing Request Sent!</h3>
					<p class="text-gray-600 mb-4">
						Your viewing request has been sent to the agent. They will contact you shortly to confirm the appointment.
					</p>
					<div class="bg-gray-50 rounded-lg p-4 text-left">
						<h4 class="font-medium text-gray-900 mb-2">Viewing Details:</h4>
						<div class="space-y-1 text-sm text-gray-600">
							<div><strong>Date:</strong> {formatDateDisplay(selectedDate)}</div>
							<div><strong>Time:</strong> {formatTimeDisplay(selectedTime)}</div>
							<div><strong>Contact:</strong> {phone}</div>
							{#if message}
								<div><strong>Message:</strong> {message}</div>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<!-- Form -->
				<form on:submit|preventDefault={submitViewing} class="p-6 space-y-6">
					{#if error}
						<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
							{error}
						</div>
					{/if}

					<!-- Date Selection -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Calendar class="w-4 h-4 inline mr-1" />
							Preferred Date *
						</label>
						<input
							type="date"
							bind:value={selectedDate}
							min={minDate}
							max={maxDateStr}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">Available dates: Tomorrow to 30 days from now</p>
					</div>

					<!-- Time Selection -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Clock class="w-4 h-4 inline mr-1" />
							Preferred Time *
						</label>
						<select 
							bind:value={selectedTime}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
							required
						>
							<option value="">Select a time</option>
							{#each timeSlots as time}
								<option value={time}>{formatTimeDisplay(time)}</option>
							{/each}
						</select>
						<p class="text-xs text-gray-500 mt-1">Business hours: 9:00 AM to 6:00 PM</p>
					</div>

					<!-- Phone Number -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Phone class="w-4 h-4 inline mr-1" />
							Phone Number *
						</label>
						<input
							type="tel"
							bind:value={phone}
							placeholder="+234 XXX XXX XXXX"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">The agent will call you on this number</p>
					</div>

					<!-- Message (Optional) -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<MessageSquare class="w-4 h-4 inline mr-1" />
							Additional Message (Optional)
						</label>
						<textarea
							bind:value={message}
							rows="3"
							placeholder="Any specific requirements or questions..."
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
						></textarea>
					</div>

					<!-- Agent Info -->
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 class="font-medium text-gray-900 mb-2">Agent Information</h4>
						<div class="flex items-center">
							<div class="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
							<div>
								<div class="font-medium text-gray-900">{property?.agent?.name}</div>
								<div class="text-sm text-gray-600">Real Estate Agent</div>
							</div>
						</div>
						<p class="text-sm text-gray-600 mt-2">
							Response time: Usually within 2 hours
						</p>
					</div>

					<!-- Form Actions -->
					<div class="flex space-x-3 pt-4">
						<button
							type="button"
							on:click={closeModal}
							class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !selectedDate || !selectedTime || !phone}
							class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loading}
								<div class="flex items-center justify-center">
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Scheduling...
								</div>
							{:else}
								Schedule Viewing
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Ensure the modal is always on top */
	:global(body:has(.fixed.inset-0)) {
		overflow: hidden;
	}
</style>
