import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const propertyId = params.id;
		
		if (!propertyId || isNaN(parseInt(propertyId))) {
			throw error(400, 'Invalid property ID');
		}

		// Fetch property data from the API
		const response = await fetch(`/api/properties/${propertyId}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Property not found');
			}
			throw error(500, 'Failed to load property');
		}

		const responseData = await response.json();
		
		return {
			property: responseData.property || responseData,
			propertyId: parseInt(propertyId)
		};
	} catch (err) {
		console.error('Error in property load function:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to load property');
	}
};
