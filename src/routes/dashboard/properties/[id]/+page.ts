import { browser } from '$app/environment';

export async function load({ params, fetch, depends }: {
  params: { id: string },
  fetch: any,
  depends: (dep: string) => void
}) {
  const propertyId = params.id;
  depends(`app:property:${propertyId}`);
  
  console.log('Client-side load function called for property ID:', propertyId);
  
  // Only fetch on client side to prevent SSR issues
  if (browser) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token available');
        return {
          property: null,
          error: 'Authentication required'
        };
      }
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Property pre-loaded:', data.property?.id);
        return {
          property: data.property,
          error: null
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to pre-load property:', response.status, errorData);
        return {
          property: null,
          error: `Failed to load property: ${response.status}`
        };
      }
    } catch (err: unknown) {
      console.error('Error pre-loading property data:', err);
      return {
        property: null,
        error: err instanceof Error ? err.message : 'Unknown error loading property'
      };
    }
  }
  
  return {
    property: null,
    error: null
  };
}
