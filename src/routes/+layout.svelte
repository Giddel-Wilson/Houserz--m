<script lang="ts">
	import '../app.css';
	import NotificationContainer from '$lib/components/NotificationContainer.svelte';

	let { children } = $props();
</script>

{@render children()}
<NotificationContainer />
