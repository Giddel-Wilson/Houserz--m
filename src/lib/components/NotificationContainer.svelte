<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import Notification from './Notification.svelte';
</script>

<div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
	{#each $notifications as notification (notification.id)}
		<Notification
			type={notification.type}
			title={notification.title}
			message={notification.message}
			duration={notification.duration}
			persistent={notification.persistent}
			onClose={() => notifications.removeNotification(notification.id)}
		/>
	{/each}
</div>
