import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET
import { prisma } from '$lib/database.js';
import { uploadToCloudinary } from '$lib/cloudinary';

export const POST: RequestHandler = async ({ request }) => {
	try {
		console.log('Starting property creation request...');
		
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			console.log('No valid authorization header');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
			console.log('Decoded JWT:', decoded);
		} catch (error) {
			console.log('JWT verification failed:', error);
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const body = await request.json();
		console.log('Request body received:', { ...body, images: body.images ? `${body.images.length} images` : 'no images' });
		
		const {
			title,
			description,
			property_type,
			listing_type,
			price,
			location,
			state,
			bedrooms,
			bathrooms,
			area_sqft,
			amenities,
			images
		} = body;

		if (!title || !description || !price || !location || !state) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Use decoded.id since that's what the JWT contains
		const userId = decoded.id;
		console.log('Looking up user with ID:', userId);
		
		try {
			// Use Prisma to find user
			console.log('Starting Prisma user query for ID:', userId);
			let user;
			try {
				user = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						id: true,
						role: true,
						fullName: true,
						email: true
					}
				});
				console.log('User query successful, result:', user);
			} catch (userQueryError) {
				console.error('Prisma user query failed:', userQueryError);
				return json({ error: 'Database connection error' }, { status: 500 });
			}

			if (!user) {
				console.log('User not found in database');
				return json({ error: 'User not found' }, { status: 404 });
			}

			console.log('Found user:', { id: user.id, role: user.role, email: user.email });
			
			if (!user.role || (user.role.toUpperCase() !== 'AGENT')) {
				console.log('User role check failed:', user.role);
				return json({ error: 'Access denied. Agent role required.' }, { status: 403 });
			}

			// Upload images to Cloudinary
			const uploadedImages = [];
			if (images && images.length > 0) {
				console.log('Uploading', images.length, 'images to Cloudinary');
				for (const image of images) {
					try {
						const uploadResult = await uploadToCloudinary(image, 'houserz/properties');
						uploadedImages.push(uploadResult.secure_url);
						console.log('Image uploaded successfully');
					} catch (error) {
						console.error('Image upload failed:', error);
					}
				}
			}

			// Create property using Prisma
			console.log('Creating property for user:', user.id);
			
			const property = await prisma.property.create({
				data: {
					agentId: user.id,
					title,
					description,
					propertyType: property_type,
					listingType: listing_type.toUpperCase(),
					price: parseFloat(price),
					city: location,
					state,
					address: `${location}, ${state}`,
					country: 'Nigeria',
					bedrooms: bedrooms ? parseInt(bedrooms) : null,
					bathrooms: bathrooms ? parseInt(bathrooms) : null,
					sqft: area_sqft ? parseFloat(area_sqft) : null,
					features: JSON.stringify(amenities || []),
					status: 'ACTIVE'
				}
			});
			
			console.log('Property created in database:', { id: property.id, title: property.title });

			// Insert images if uploaded successfully using Prisma
			if (uploadedImages.length > 0) {
				console.log('Inserting', uploadedImages.length, 'image records');
				for (let i = 0; i < uploadedImages.length; i++) {
					await prisma.propertyImage.create({
						data: {
							propertyId: property.id,
							imageUrl: uploadedImages[i],
							displayOrder: i,
							isPrimary: i === 0 // First image is primary
						}
					});
				}
			}

			return json({ 
				success: true, 
				property: {
					...property,
					images: uploadedImages
				}
			});

		} catch (dbError) {
			console.error('Database error during property creation:', dbError);
			const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
			return json({ error: 'Database error: ' + errorMessage }, { status: 500 });
		}

	} catch (error) {
		console.error('Error creating property:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: 'Internal server error: ' + errorMessage }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		if (decoded.role !== 'agent' && decoded.role !== 'AGENT') {
			return json({ error: 'Agent access required' }, { status: 403 });
		}

		// Get agent's properties using Prisma
		const properties = await prisma.property.findMany({
			where: { agentId: decoded.id },
			include: {
				images: {
					orderBy: { displayOrder: 'asc' }
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return json({ properties });

	} catch (error) {
		console.error('Error fetching agent properties:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
