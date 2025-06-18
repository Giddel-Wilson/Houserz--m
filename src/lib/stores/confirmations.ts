import { writable } from 'svelte/store';

export interface ConfirmationData {
	id: string;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmVariant?: 'danger' | 'warning' | 'primary';
	onConfirm: () => void | Promise<void>;
	onCancel?: () => void;
}

function createConfirmationStore() {
	const { subscribe, set, update } = writable<ConfirmationData | null>(null);

	return {
		subscribe,
		showConfirmation: (confirmation: Omit<ConfirmationData, 'id'>) => {
			const id = Math.random().toString(36).substr(2, 9);
			const newConfirmation: ConfirmationData = {
				id,
				confirmText: 'Confirm',
				cancelText: 'Cancel',
				confirmVariant: 'primary',
				...confirmation
			};
			set(newConfirmation);
			return id;
		},
		hideConfirmation: () => {
			set(null);
		}
	};
}

export const confirmationDialog = createConfirmationStore();

// Convenience function for delete confirmations
export function showDeleteConfirmation(
	itemName: string,
	onConfirm: () => void | Promise<void>
) {
	return confirmationDialog.showConfirmation({
		title: 'Delete Confirmation',
		message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
		confirmText: 'Delete',
		cancelText: 'Cancel',
		confirmVariant: 'danger',
		onConfirm
	});
}
