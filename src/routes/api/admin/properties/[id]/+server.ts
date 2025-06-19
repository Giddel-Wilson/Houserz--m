import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database.js';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';

// JWT_SECRET will be accessed via process.env.JWT_SECRET

export const DELETE: RequestHandler = async ({ request, params }) => {
	try {
		console.log('[Admin Properties DELETE] Request received for property:', params.id);
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		let decoded;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}
		
		if (!decoded || decoded.role !== 'ADMIN') {
			return json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
		}

		const propertyId = parseInt(params.id);
		
		if (isNaN(propertyId)) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		// Check if property exists
		const property = await prisma.property.findUnique({
			where: { id: propertyId }
		});

		if (!property) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		// Delete the property
		await prisma.property.delete({
			where: { id: propertyId }
		});

		console.log('[Admin Properties DELETE] Property deleted successfully:', propertyId);
		return json({ message: 'Property deleted successfully' });

	} catch (error) {
		console.error('[Admin Properties DELETE] Error:', error);
		return json({ error: 'Failed to delete property' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		console.log('[Admin Properties PATCH] Request received for property:', params.id);
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		let decoded;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}
		
		if (!decoded || decoded.role !== 'ADMIN') {
			return json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
		}

		const propertyId = parseInt(params.id);
		
		if (isNaN(propertyId)) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		const { status, adminNote } = await request.json();

		if (!status) {
			return json({ error: 'Status is required' }, { status: 400 });
		}

		// Check if property exists
		const property = await prisma.property.findUnique({
			where: { id: propertyId }
		});

		if (!property) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		// Update the property
		const updatedProperty = await prisma.property.update({
			where: { id: propertyId },
			data: {
				status,
				...(adminNote && { adminNote })
			},
			include: {
				agent: {
					select: {
						id: true,
						fullName: true,
						email: true,
						phone: true
					}
				}
			}
		});

		console.log('[Admin Properties PATCH] Property updated successfully:', propertyId);
		return json({ property: updatedProperty });

	} catch (error) {
		console.error('[Admin Properties PATCH] Error:', error);
		return json({ error: 'Failed to update property' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		console.log('[Admin Properties GET] Request received for property:', params.id);
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		let decoded;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}
		
		if (!decoded || decoded.role !== 'ADMIN') {
			return json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
		}

		const propertyId = parseInt(params.id);
		
		if (isNaN(propertyId)) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		// Get property details with images and agent info
		const property = await prisma.property.findUnique({
			where: { id: propertyId },
			include: {
				images: {
					orderBy: { displayOrder: 'asc' }
				},
				agent: {
					select: {
						id: true,
						fullName: true,
						email: true,
						phone: true
					}
				}
			}
		});

		if (!property) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		console.log('[Admin Properties GET] Property retrieved successfully:', propertyId);
		return json({ property });

	} catch (error) {
		console.error('[Admin Properties GET] Error:', error);
		return json({ error: 'Failed to retrieve property' }, { status: 500 });
	}
};
