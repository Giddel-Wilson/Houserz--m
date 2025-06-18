<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();
	let user: any = null;
	let currentPage = '';
	
	// Debug current route
	console.log('Dashboard layout loaded, current path:', $page.url.pathname);
	
	// Use $effect for reactivity in runes mode
	$effect(() => {
		// Update currentPage based on route
		if ($page && $page.url && $page.url.pathname) {
			const path = $page.url.pathname;
			console.log('Route changed:', path);
			
			if (path.includes('/dashboard/properties')) {
				currentPage = 'properties';
			} else if (path.includes('/dashboard/favorites')) {
				currentPage = 'favorites';
			} else if (path.includes('/dashboard/viewings')) {
				currentPage = 'viewings';
			} else if (path.includes('/dashboard/messages')) {
				currentPage = 'messages';
			} else if (path.includes('/dashboard/profile')) {
				currentPage = 'profile';
			} else if (path.includes('/dashboard/settings')) {
				currentPage = 'settings';
			} else if (path === '/dashboard') {
				currentPage = 'dashboard';
			}
		}
	});

	onMount(() => {
		// Check if user is authenticated
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');
		
		if (!userData || !token) {
			console.error('No user data or token found, redirecting to login');
			goto('/login');
			return;
		}

		try {
			user = JSON.parse(userData);
			console.log('User loaded in dashboard layout:', user.email, 'Role:', user.role);
		} catch (e) {
			console.error('Error parsing user data:', e);
			goto('/login');
			return;
		}

		// Redirect agents and admins to their respective dashboards
		if (user.role === 'agent' || user.role === 'AGENT') {
			console.log('Agent detected, redirecting to /agent');
			goto('/agent');
			return;
		}
		if (user.role === 'admin' || user.role === 'ADMIN') {
			console.log('Admin detected, redirecting to /admin');
			goto('/admin');
			return;
		}
		
		console.log('Dashboard layout setup complete, role:', user.role);
	});
</script>

{@render children()}
