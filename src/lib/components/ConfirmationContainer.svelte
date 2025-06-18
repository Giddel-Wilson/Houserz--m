<script lang="ts">
	import { confirmationDialog } from '$lib/stores/confirmations';
	import ConfirmationDialog from './ConfirmationDialog.svelte';
</script>

{#if $confirmationDialog}
	<ConfirmationDialog
		confirmation={$confirmationDialog}
		onClose={() => confirmationDialog.hideConfirmation()}
	/>
{/if}
