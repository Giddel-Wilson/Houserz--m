<script lang="ts">
	import { goto } from '$app/navigation';
	import { Upload, X } from 'lucide-svelte';
	import { showSuccess, showError, showWarning } from '$lib/stores/notifications';

	let formData = {
		title: '',
		description: '',
		property_type: 'apartment',
		listing_type: 'sale',
		price: '',
		location: '',
		state: '',
		bedrooms: '',
		bathrooms: '',
		area_sqft: '',
		amenities: []
	};

	let images: string[] = [];
	let uploading = false;
	let submitting = false;

	const nigerianStates = [
		'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
		'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
		'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
		'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
		'Yobe', 'Zamfara'
	];

	const availableAmenities = [
		'Swimming Pool', 'Gym', 'Security', 'Parking', 'Garden', 'Balcony', 'Elevator',
		'Generator', 'Air Conditioning', 'Furnished', 'Internet', 'Cable TV', 'Water Supply',
		'Waste Disposal', 'Shopping Mall Nearby', 'School Nearby', 'Hospital Nearby'
	];

	function toggleAmenity(amenity: string) {
		if (formData.amenities.includes(amenity)) {
			formData.amenities = formData.amenities.filter(a => a !== amenity);
		} else {
			formData.amenities = [...formData.amenities, amenity];
		}
	}

	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		
		if (!files) return;

		uploading = true;
		
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				
				// Create a data URL from the actual file
				const reader = new FileReader();
				
				await new Promise((resolve) => {
					reader.onload = (e) => {
						const result = e.target?.result as string;
						images = [...images, result];
						resolve(null);
					};
					reader.readAsDataURL(file);
				});
			}
		} catch (error) {
			console.error('Error uploading images:', error);
			alert('Failed to upload images');
		} finally {
			uploading = false;
		}
	}

	let fileInput: HTMLInputElement;

	function triggerFileUpload() {
		fileInput?.click();
	}

	function removeImage(index: number) {
		images = images.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		// Validation
		if (!formData.title || !formData.description || !formData.price || !formData.location || !formData.state) {
			alert('Please fill in all required fields');
			return;
		}

		if (images.length === 0) {
			alert('Please upload at least one image');
			return;
		}

		submitting = true;

		try {
			const token = localStorage.getItem('token');
			
			const response = await fetch('/api/agent/properties', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					price: parseFloat(formData.price),
					bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
					bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
					area_sqft: formData.area_sqft ? parseFloat(formData.area_sqft) : null,
					images
				})
			});

			if (response.ok) {
				const result = await response.json();
				alert('Property added successfully!');
				goto('/agent/properties');
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to add property');
			}
		} catch (error) {
			console.error('Error adding property:', error);
			alert('Error adding property');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Add Property - Houserz Agent</title>
</svelte:head>

<div class="mx-auto  overflow-hidden p-4 pt-5 pb-0 lg:p-6 lg:py-4">
	<div class="mb-6 lg:mb-8">
		<h1 class="ml-12 text-2xl font-bold text-gray-900 lg:ml-0 lg:text-3xl">Add New Property</h1>
		<p class="mt-2 text-gray-600">Fill in the details to list your property</p>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-6 lg:space-y-8">
		<!-- Basic Information -->
		<div class="rounded-lg bg-white p-4 shadow lg:p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<div class="lg:col-span-2">
					<label class="mb-2 block text-sm font-medium text-gray-700"> Property Title * </label>
					<input
						type="text"
						bind:value={formData.title}
						placeholder="e.g., Luxury 3 Bedroom Apartment in Lekki"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Property Type * </label>
					<select
						bind:value={formData.property_type}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					>
						<option value="apartment">Apartment</option>
						<option value="house">House</option>
						<option value="duplex">Duplex</option>
						<option value="bungalow">Bungalow</option>
						<option value="commercial">Commercial</option>
						<option value="land">Land</option>
					</select>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Listing Type * </label>
					<select
						bind:value={formData.listing_type}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					>
						<option value="sale">For Sale</option>
						<option value="rent">For Rent</option>
					</select>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Price (₦) * </label>
					<input
						type="number"
						bind:value={formData.price}
						placeholder="5000000"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Area (sq ft) </label>
					<input
						type="number"
						bind:value={formData.area_sqft}
						placeholder="1500"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
					/>
				</div>
			</div>
		</div>

		<!-- Location -->
		<div class="rounded-lg bg-white p-4 shadow lg:p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Location</h2>
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Location/Address * </label>
					<input
						type="text"
						bind:value={formData.location}
						placeholder="e.g., Lekki Phase 1, Lagos"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> State * </label>
					<select
						bind:value={formData.state}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					>
						<option value="">Select State</option>
						{#each nigerianStates as state}
							<option value={state}>{state}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Property Details -->
		<div class="rounded-lg bg-white p-4 shadow lg:p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Property Details</h2>
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Bedrooms </label>
					<input
						type="number"
						bind:value={formData.bedrooms}
						placeholder="3"
						min="0"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Bathrooms </label>
					<input
						type="number"
						bind:value={formData.bathrooms}
						placeholder="2"
						min="0"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
					/>
				</div>

				<div class="lg:col-span-2">
					<label class="mb-2 block text-sm font-medium text-gray-700"> Description * </label>
					<textarea
						bind:value={formData.description}
						rows="4"
						placeholder="Describe the property, its features, and surroundings..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
						required
					></textarea>
				</div>
			</div>
		</div>

		<!-- Amenities -->
		<div class="rounded-lg bg-white p-4 shadow lg:p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Amenities</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each availableAmenities as amenity}
					<label class="flex items-center">
						<input
							type="checkbox"
							checked={formData.amenities.includes(amenity)}
							on:change={() => toggleAmenity(amenity)}
							class="rounded border-gray-300 text-green-600 focus:ring-green-500"
						/>
						<span class="ml-2 text-sm text-gray-700">{amenity}</span>
					</label>
				{/each}
			</div>
		</div>

		<!-- Images -->
		<div class="rounded-lg bg-white p-4 shadow lg:p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Property Images *</h2>

			<!-- Upload Area -->
			<div 
				class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 cursor-pointer transition-colors"
				on:click={triggerFileUpload}
				on:keydown={(e) => e.key === 'Enter' && triggerFileUpload()}
				role="button"
				tabindex="0"
			>
				<Upload class="mx-auto h-12 w-12 text-gray-400" />
				<div class="mt-4">
					<span class="mt-2 block text-sm font-medium text-gray-900">
						Upload property images
					</span>
					<p class="mt-1 text-xs text-gray-500">
						PNG, JPG, GIF up to 10MB each
					</p>
				</div>
			</div>

			<!-- Hidden file input -->
			<input
				bind:this={fileInput}
				type="file"
				multiple
				accept="image/*"
				on:change={handleImageUpload}
				class="hidden"
			>

			<!-- Uploading indicator -->
			{#if uploading}
				<div class="mt-4 text-center">
					<div class="inline-flex items-center">
						<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-green-600"></div>
						<span class="text-sm text-gray-600">Uploading images...</span>
					</div>
				</div>
			{/if}

			<!-- Image Preview -->
			{#if images.length > 0}
				<div class="mt-6">
					<p class="mb-3 text-sm font-medium text-gray-700">Uploaded Images ({images.length})</p>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
						{#each images as image, index}
							<div class="relative group">
								<img
									src={image}
									alt="Property {index + 1}"
									class="h-24 w-full rounded-lg object-cover border border-gray-200"
								/>
								<button
									type="button"
									on:click={() => removeImage(index)}
									class="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<X class="h-3 w-3" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Submit Button -->
		<div
			class="sticky bottom-0 -mx-4 flex flex-col justify-end space-y-3 bg-gradient-to-br from-teal-50 to-green-50 px-4 py-4 sm:flex-row sm:space-y-0 sm:space-x-4 lg:-mx-6 lg:px-6"
		>
			<button
				type="button"
				on:click={() => goto('/agent/properties')}
				class="w-full rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 sm:w-auto"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
			>
				{submitting ? 'Adding Property...' : 'Add Property'}
			</button>
		</div>
	</form>
</div>
