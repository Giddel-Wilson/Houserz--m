<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { ConfirmationData } from '$lib/stores/confirmations';

	export let confirmation: ConfirmationData;
	export let onClose: () => void;

	let isProcessing = false;

	async function handleConfirm() {
		try {
			isProcessing = true;
			await confirmation.onConfirm();
			onClose();
		} catch (error) {
			console.error('Error in confirmation action:', error);
		} finally {
			isProcessing = false;
		}
	}

	function handleCancel() {
		if (confirmation.onCancel) {
			confirmation.onCancel();
		}
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

<!-- Backdrop -->
<div 
	class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
	on:click={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-labelledby="confirmation-title"
>
	<!-- Dialog -->
	<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
		<!-- Close button -->
		<button
			on:click={handleCancel}
			class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
			aria-label="Close dialog"
		>
			<X class="w-5 h-5" />
		</button>

		<!-- Content -->
		<div class="pr-8">
			<h3 id="confirmation-title" class="text-lg font-semibold text-gray-900 mb-3">
				{confirmation.title}
			</h3>
			
			<p class="text-gray-600 mb-6">
				{confirmation.message}
			</p>

			<!-- Actions -->
			<div class="flex gap-3 justify-end">
				<button
					on:click={handleCancel}
					disabled={isProcessing}
					class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{confirmation.cancelText}
				</button>
				
				<button
					on:click={handleConfirm}
					disabled={isProcessing}
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 {
						confirmation.confirmVariant === 'danger' 
							? 'bg-red-600 hover:bg-red-700 text-white' 
							: confirmation.confirmVariant === 'warning'
							? 'bg-yellow-600 hover:bg-yellow-700 text-white'
							: 'bg-green-600 hover:bg-green-700 text-white'
					}"
				>
					{#if isProcessing}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					{confirmation.confirmText}
				</button>
			</div>
		</div>
	</div>
</div>
