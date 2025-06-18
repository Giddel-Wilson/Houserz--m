import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		// Get query parameters for filtering
		const searchQuery = url.searchParams.get('search') || '';
		const location = url.searchParams.get('location') || '';
		const type = url.searchParams.get('type') || '';
		const priceRange = url.searchParams.get('priceRange') || '';

		// Build API URL with query parameters
		const apiUrl = new URL('/api/properties', url.origin);
		if (searchQuery) apiUrl.searchParams.set('search', searchQuery);
		if (location) apiUrl.searchParams.set('location', location);
		if (type) apiUrl.searchParams.set('type', type);
		if (priceRange) apiUrl.searchParams.set('priceRange', priceRange);

		const response = await fetch(apiUrl.toString());
		
		if (!response.ok) {
			console.error('Failed to fetch properties:', response.status, response.statusText);
			// Return empty properties instead of throwing error
			return {
				properties: [],
				total: 0,
				filters: {
					searchQuery,
					location,
					type,
					priceRange
				}
			};
		}

		const data = await response.json();
		
		return {
			properties: data.properties || [],
			total: data.total || 0,
			filters: {
				searchQuery,
				location,
				type,
				priceRange
			}
		};
	} catch (err) {
		console.error('Error in properties load function:', err);
		// Return empty properties instead of throwing error
		return {
			properties: [],
			total: 0,
			filters: {
				searchQuery: '',
				location: '',
				type: '',
				priceRange: ''
			}
		};
	}
};
