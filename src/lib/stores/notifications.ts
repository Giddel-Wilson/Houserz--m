import { writable } from 'svelte/store';

export interface NotificationData {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title?: string;
	message: string;
	duration?: number;
	persistent?: boolean;
}

function createNotificationStore() {
	const { subscribe, set, update } = writable<NotificationData[]>([]);

	return {
		subscribe,
		addNotification: (notification: Omit<NotificationData, 'id'>) => {
			const id = Math.random().toString(36).substr(2, 9);
			const newNotification: NotificationData = {
				id,
				duration: 5000,
				persistent: false,
				...notification
			};

			update(notifications => [...notifications, newNotification]);

			// Auto-remove notification after duration (if not persistent)
			if (!newNotification.persistent && newNotification.duration > 0) {
				setTimeout(() => {
					removeNotification(id);
				}, newNotification.duration);
			}

			return id;
		},
		removeNotification: (id: string) => {
			update(notifications => notifications.filter(n => n.id !== id));
		},
		clearAll: () => {
			set([]);
		}
	};
}

export const notifications = createNotificationStore();

// Convenience functions
export function showSuccess(message: string, title?: string, options?: Partial<NotificationData>) {
	return notifications.addNotification({
		type: 'success',
		message,
		title,
		...options
	});
}

export function showError(message: string, title?: string, options?: Partial<NotificationData>) {
	return notifications.addNotification({
		type: 'error',
		message,
		title,
		...options
	});
}

export function showWarning(message: string, title?: string, options?: Partial<NotificationData>) {
	return notifications.addNotification({
		type: 'warning',
		message,
		title,
		...options
	});
}

export function showInfo(message: string, title?: string, options?: Partial<NotificationData>) {
	return notifications.addNotification({
		type: 'info',
		message,
		title,
		...options
	});
}
