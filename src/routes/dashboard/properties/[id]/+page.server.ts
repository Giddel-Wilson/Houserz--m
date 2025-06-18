import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    
    console.log('Server-side load for property ID:', propertyId);
    
    if (!propertyId) {
      throw error(400, 'Missing property ID');
    }
    
    // We'll return the ID and let the client-side handle the data fetching
    // This ensures the route is properly loaded
    return {
      propertyId,
      timestamp: new Date().toISOString()
    };
  } catch (err: unknown) {
    console.error('Error in property details page load:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to load property';
    throw error(500, errorMessage);
  }
}
