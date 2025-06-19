import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    console.log('Properties API: Starting request...');
    
    const search = url.searchParams.get('search');
    const location = url.searchParams.get('location');
    const propertyType = url.searchParams.get('type');
    const bedrooms = url.searchParams.get('bedrooms');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('Properties API: Query params:', { search, location, propertyType, bedrooms });

    // Build where conditions
    const where: any = {
      status: 'ACTIVE'
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.OR = where.OR || [];
      where.OR.push(
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } }
      );
    }

    if (propertyType) {
      where.propertyType = { equals: propertyType, mode: 'insensitive' };
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms);
    }

    console.log('Properties API: Where clause:', JSON.stringify(where, null, 2));

    // Fetch properties with includes
    console.log('Properties API: Fetching with relationships...');
    const properties = await prisma.property.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        images: {
          orderBy: {
            displayOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    console.log(`Properties API: Found ${properties.length} properties with relationships`);

    // Transform the data carefully
    const transformedProperties = properties.map((property, index) => {
      console.log(`Processing property ${index + 1}: ${property.title}`);
      
      const transformed: any = {
        id: property.id,
        title: property.title || 'Untitled Property',
        description: property.description || '',
        price: Number(property.price) || 0,
        location: property.city && property.state 
          ? `${property.city}, ${property.state}` 
          : property.city || property.state || 'Location not specified',
        city: property.city || '',
        state: property.state || '',
        property_type: property.propertyType || 'Unknown',
        propertyType: property.propertyType || 'Unknown',
        listingType: property.listingType || 'RENT',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        square_feet: property.sqft || 0,
        sqft: property.sqft || 0,
        status: property.status || 'ACTIVE',
        featured: property.isFeatured || false,
        images: [] as any[],
        agent: null as any,
        created_at: property.createdAt,
        updated_at: property.updatedAt,
      };

      // Handle images safely
      if (property.images && Array.isArray(property.images)) {
        transformed.images = property.images.map(img => ({
          id: img.id,
          image_url: img.imageUrl || '',
          imageUrl: img.imageUrl || '',
          is_primary: img.isPrimary || false,
          isPrimary: img.isPrimary || false,
          displayOrder: img.displayOrder || 0
        }));
      }

      // Handle agent safely
      if (property.agent) {
        transformed.agent = {
          id: property.agent.id,
          name: property.agent.fullName || property.agent.email || 'Unknown Agent',
          fullName: property.agent.fullName || '',
          email: property.agent.email || '',
          phone: property.agent.phone || '',
          company: property.agent.company || ''
        };
      }

      return transformed;
    });

    console.log(`Properties API: Successfully transformed ${transformedProperties.length} properties`);

    // Get total count for pagination
    const total = await prisma.property.count({ where });

    const response = { 
      properties: transformedProperties,
      total,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      total_pages: Math.ceil(total / limit)
    };

    console.log('Properties API: Returning response with', transformedProperties.length, 'properties');

    return json(response);

  } catch (error: any) {
    console.error('Properties API Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return json({ 
      error: 'Failed to fetch properties',
      message: error.message,
      properties: [],
      total: 0,
      page: 1,
      per_page: 50,
      total_pages: 0
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      title,
      description,
      price,
      location,
      property_type,
      bedrooms,
      bathrooms,
      square_feet,
      status,
      agent_id,
      images
    } = await request.json();

    // Validate required fields
    if (!title || !price || !location || !property_type || !agent_id) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create property using Prisma
    const property = await prisma.property.create({
      data: {
        agentId: agent_id,
        title,
        description: description || '',
        propertyType: property_type,
        price: Number(price),
        address: location,
        city: location, // Simple approach - you may want to parse this better
        state: 'Unknown', // You may want to extract state from location
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        sqft: square_feet || 0,
        status: status || 'ACTIVE',
        listingType: 'RENT'
      }
    });

    // Add images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await prisma.propertyImage.create({
          data: {
            propertyId: property.id,
            imageUrl: image.url || image,
            isPrimary: i === 0,
            displayOrder: i
          }
        });
      }
    }

    return json({ property }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating property:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
