import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database.js';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';

// JWT_SECRET will be accessed via process.env.JWT_SECRET

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		console.log('[Admin Properties Status] Request received for property:', params.id);
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

		const { status } = await request.json();

		if (!status) {
			return json({ error: 'Status is required' }, { status: 400 });
		}

		// Validate status
		const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'SOLD'];
		if (!validStatuses.includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		// Check if property exists
		const property = await prisma.property.findUnique({
			where: { id: propertyId }
		});

		if (!property) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		// Update the property status
		const updatedProperty = await prisma.property.update({
			where: { id: propertyId },
			data: { status },
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

		console.log('[Admin Properties Status] Property status updated successfully:', propertyId, status);
		return json({ property: updatedProperty });

	} catch (error) {
		console.error('[Admin Properties Status] Error:', error);
		return json({ error: 'Failed to update property status' }, { status: 500 });
	}
};
