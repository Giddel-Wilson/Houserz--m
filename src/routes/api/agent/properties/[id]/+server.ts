import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET
import { prisma } from '$lib/database.js';

export const GET: RequestHandler = async ({ params, request }) => {
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

		const propertyId = parseInt(params.id);
		if (!propertyId) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		// Get property details with images
		const property = await prisma.property.findFirst({
			where: { 
				id: propertyId,
				agentId: decoded.id // Ensure agent can only access their own properties
			},
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

		return json({ property });

	} catch (error) {
		console.error('Error fetching property:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request }) => {
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

		const propertyId = parseInt(params.id);
		if (!propertyId) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		const body = await request.json();
		const updates: any = {};

		// Allow updating specific fields
		const allowedFields = [
			'title', 'description', 'price', 'bedrooms', 'bathrooms', 
			'sqft', 'features', 'status', 'city', 'state', 'address'
		];

		for (const field of allowedFields) {
			if (body[field] !== undefined) {
				updates[field] = body[field];
			}
		}

		if (Object.keys(updates).length === 0) {
			return json({ error: 'No valid fields to update' }, { status: 400 });
		}

		// Verify the property belongs to this agent
		const existingProperty = await prisma.property.findFirst({
			where: { 
				id: propertyId,
				agentId: decoded.id 
			}
		});

		if (!existingProperty) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		// Update the property
		const updatedProperty = await prisma.property.update({
			where: { id: propertyId },
			data: updates,
			include: {
				images: {
					orderBy: { displayOrder: 'asc' }
				}
			}
		});

		return json({ property: updatedProperty });

	} catch (error) {
		console.error('Error updating property:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
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

		const propertyId = parseInt(params.id);
		if (!propertyId) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		// Verify the property belongs to this agent
		const existingProperty = await prisma.property.findFirst({
			where: { 
				id: propertyId,
				agentId: decoded.id 
			}
		});

		if (!existingProperty) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		// Delete the property (images will be deleted due to CASCADE)
		await prisma.property.delete({
			where: { id: propertyId }
		});

		return json({ success: true });

	} catch (error) {
		console.error('Error deleting property:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
