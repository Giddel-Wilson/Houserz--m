import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { prisma } from '$lib/database.js';

export const DELETE: RequestHandler = async ({ request, params }) => {
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

		const propertyId = parseInt(params.id as string);
		if (!propertyId) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		// Remove the favorite from database using Prisma
		await prisma.userFavorite.deleteMany({
			where: {
				userId: decoded.id,
				propertyId: propertyId
			}
		});
		
		return json({ success: true, message: 'Property removed from favorites' });

	} catch (error) {
		console.error('Error removing from favorites:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
