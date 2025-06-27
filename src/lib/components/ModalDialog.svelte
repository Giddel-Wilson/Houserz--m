<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X } from 'lucide-svelte';

	export let isOpen = false;
	export let title = '';
	export let message = '';
	export let type: 'info' | 'success' | 'error' | 'confirm' = 'info';
	export let showCancel = false;
	export let confirmText = 'OK';
	export let cancelText = 'Cancel';

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
		isOpen = false;
	}

	function handleCancel() {
		dispatch('cancel');
		isOpen = false;
	}

	function handleClose() {
		dispatch('close');
		isOpen = false;
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-semibold text-gray-900">
					{title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'confirm' ? 'Confirm' : 'Information')}
				</h3>
				<button
					on:click={handleClose}
					class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="px-6 py-4">
				<div class="flex items-start space-x-3">
					<!-- Icon based on type -->
					<div class="flex-shrink-0">
						{#if type === 'success'}
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
								<svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
						{:else if type === 'error'}
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
								<svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
						{:else if type === 'confirm'}
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
								<svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						{:else}
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
								<svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						{/if}
					</div>

					<!-- Message -->
					<div class="flex-1">
						<p class="text-sm text-gray-700">{message}</p>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end space-x-3 border-t border-gray-200 px-6 py-4">
				{#if showCancel}
					<button
						on:click={handleCancel}
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						{cancelText}
					</button>
				{/if}
				<button
					on:click={handleConfirm}
					class="rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
					class:bg-red-600={type === 'error'}
					class:hover:bg-red-700={type === 'error'}
					class:focus:ring-red-500={type === 'error'}
					class:bg-blue-600={type === 'info'}
					class:hover:bg-blue-700={type === 'info'}
					class:focus:ring-blue-500={type === 'info'}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
