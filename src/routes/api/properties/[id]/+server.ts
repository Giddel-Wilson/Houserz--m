import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types.js';
import { verifyToken } from '$lib/auth';

// Create Prisma client instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

export const GET: RequestHandler = async ({ params, request }) => {
  try {
    // Log the request to understand what's happening
    console.log('Property API endpoint called for ID:', params.id);
    
    // Check for authentication token (optional for property details)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        userId = decoded.id;
        console.log('Authenticated user accessing property:', userId);
      }
    } else {
      console.log('No authentication provided, continuing as public access');
    }
    
    const propertyId = parseInt(params.id);
    
    if (!propertyId || isNaN(propertyId)) {
      return json({ error: 'Invalid property ID' }, { status: 400 });
    }

    console.log('Fetching property with ID:', propertyId);

    // Fetch property with all related data
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
        status: 'ACTIVE' // Only return active properties
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            company: true,
            bio: true,
            licenseNumber: true,
            yearsExperience: true,
            specialization: true,
            isVerified: true
          }
        },
        images: {
          orderBy: {
            displayOrder: 'asc'
          }
        }
      }
    });

    if (!property) {
      return json({ error: 'Property not found' }, { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedProperty = {
      id: property.id,
      title: property.title || 'Untitled Property',
      description: property.description || '',
      price: Number(property.price) || 0,
      location: property.city && property.state 
        ? `${property.city}, ${property.state}` 
        : property.city || property.state || 'Location not specified',
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      postalCode: property.postalCode || '',
      country: property.country || 'Nigeria',
      property_type: property.propertyType || 'Unknown',
      propertyType: property.propertyType || 'Unknown',
      listingType: property.listingType || 'RENT',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      sqft: property.sqft || 0,
      square_feet: property.sqft || 0,
      lotSize: property.lotSize ? Number(property.lotSize) : null,
      yearBuilt: property.yearBuilt || null,
      latitude: property.latitude ? Number(property.latitude) : null,
      longitude: property.longitude ? Number(property.longitude) : null,
      features: property.features ? JSON.parse(property.features) : [],
      status: property.status || 'ACTIVE',
      isFeatured: property.isFeatured || false,
      viewsCount: property.viewsCount || 0,
      created_at: property.createdAt,
      updated_at: property.updatedAt,
      images: property.images?.map(img => ({
        id: img.id,
        image_url: img.imageUrl || '',
        imageUrl: img.imageUrl || '',
        alt_text: img.altText || '',
        altText: img.altText || '',
        is_primary: img.isPrimary || false,
        isPrimary: img.isPrimary || false,
        displayOrder: img.displayOrder || 0
      })) || [],
      agent: property.agent ? {
        id: property.agent.id,
        name: property.agent.fullName || property.agent.email || 'Unknown Agent',
        fullName: property.agent.fullName || '',
        email: property.agent.email || '',
        phone: property.agent.phone || '',
        company: property.agent.company || '',
        bio: property.agent.bio || '',
        licenseNumber: property.agent.licenseNumber || '',
        yearsExperience: property.agent.yearsExperience || 0,
        specialization: property.agent.specialization || '',
        isVerified: property.agent.isVerified || false
      } : null
    };

    // Increment views count
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        viewsCount: {
          increment: 1
        }
      }
    });

    console.log('Property fetched successfully:', transformedProperty.title);

    return json({ property: transformedProperty });

  } catch (error: any) {
    console.error('Error fetching property:', error);
    return json({ 
      error: 'Failed to fetch property',
      message: error.message 
    }, { status: 500 });
  }
};
