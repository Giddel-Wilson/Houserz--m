<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-svelte';

	export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
	export let title: string = '';
	export let message: string;
	export let duration: number = 5000; // Auto-hide after 5 seconds
	export let persistent: boolean = false; // Don't auto-hide
	export let onClose: () => void = () => {};

	let visible = true;
	let timeoutId: NodeJS.Timeout;

	const typeConfig = {
		success: {
			icon: CheckCircle,
			iconClass: 'text-green-600',
			bgClass: 'bg-green-50 border-green-200',
			titleClass: 'text-green-800',
			messageClass: 'text-green-700'
		},
		error: {
			icon: XCircle,
			iconClass: 'text-red-600',
			bgClass: 'bg-red-50 border-red-200',
			titleClass: 'text-red-800',
			messageClass: 'text-red-700'
		},
		warning: {
			icon: AlertTriangle,
			iconClass: 'text-yellow-600',
			bgClass: 'bg-yellow-50 border-yellow-200',
			titleClass: 'text-yellow-800',
			messageClass: 'text-yellow-700'
		},
		info: {
			icon: Info,
			iconClass: 'text-blue-600',
			bgClass: 'bg-blue-50 border-blue-200',
			titleClass: 'text-blue-800',
			messageClass: 'text-blue-700'
		}
	};

	$: config = typeConfig[type];
	$: IconComponent = config.icon;

	onMount(() => {
		if (!persistent && duration > 0) {
			timeoutId = setTimeout(() => {
				hide();
			}, duration);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});

	function hide() {
		visible = false;
		setTimeout(() => {
			onClose();
		}, 300); // Wait for animation to complete
	}
</script>

{#if visible}
	<div
		class="fixed top-4 right-4 z-50 max-w-sm w-full"
		transition:fly="{{ x: 300, duration: 300 }}"
	>
		<div class="rounded-lg border-2 shadow-lg {config.bgClass} p-4">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<IconComponent class="h-5 w-5 {config.iconClass}" />
				</div>
				<div class="ml-3 flex-1">
					{#if title}
						<h3 class="text-sm font-medium {config.titleClass}">
							{title}
						</h3>
					{/if}
					<div class="text-sm {config.messageClass} {title ? 'mt-1' : ''}">
						{message}
					</div>
				</div>
				<div class="ml-4 flex-shrink-0">
					<button
						on:click={hide}
						class="inline-flex rounded-md p-1.5 transition-colors {config.iconClass} hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-{type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500"
					>
						<span class="sr-only">Dismiss</span>
						<X class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
