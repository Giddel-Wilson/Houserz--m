import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { prisma } from '$lib/database.js';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, JWT_SECRET);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Get user favorites using Prisma
		const favorites = await prisma.userFavorite.findMany({
			where: {
				userId: decoded.id
			},
			include: {
				property: {
					include: {
						images: {
							orderBy: {
								displayOrder: 'asc'
							}
						},
						agent: {
							select: {
								id: true,
								fullName: true,
								email: true,
								phone: true,
								company: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		// Transform favorites data to match expected format
		const formattedFavorites = favorites.map(favorite => ({
			id: favorite.property.id,
			title: favorite.property.title,
			price: Number(favorite.property.price),
			location: `${favorite.property.city}, ${favorite.property.state}`,
			city: favorite.property.city,
			state: favorite.property.state,
			bedrooms: favorite.property.bedrooms,
			bathrooms: favorite.property.bathrooms,
			square_feet: favorite.property.sqft,
			property_type: favorite.property.propertyType,
			favorited_at: favorite.createdAt,
			images: favorite.property.images.map(img => ({
				id: img.id,
				image_url: img.imageUrl,
				imageUrl: img.imageUrl,
				is_primary: img.isPrimary,
				isPrimary: img.isPrimary,
				displayOrder: img.displayOrder
			})),
			agent: favorite.property.agent
		}));
		
		return json({ favorites: formattedFavorites });

	} catch (error) {
		console.error('Error fetching user favorites:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, JWT_SECRET);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { property_id } = await request.json();
		if (!property_id) {
			return json({ error: 'Property ID is required' }, { status: 400 });
		}

		// Add favorite to the database using Prisma
		await prisma.userFavorite.upsert({
			where: {
				userId_propertyId: {
					userId: decoded.id,
					propertyId: property_id
				}
			},
			update: {},
			create: {
				userId: decoded.id,
				propertyId: property_id
			}
		});
		
		return json({ success: true, message: 'Property added to favorites' });

	} catch (error) {
		console.error('Error adding to favorites:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, JWT_SECRET);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { property_id } = await request.json();
		if (!property_id) {
			return json({ error: 'Property ID is required' }, { status: 400 });
		}

		// Remove the favorite from database using Prisma
		await prisma.userFavorite.deleteMany({
			where: {
				userId: decoded.id,
				propertyId: property_id
			}
		});
		
		return json({ success: true, message: 'Property removed from favorites' });

	} catch (error) {
		console.error('Error removing from favorites:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
