import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ request }) => {
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

		// Get recent property views
		const { rows: recentViews } = await db.query(`
			SELECT 
				p.id, 
				p.title, 
				p.price, 
				p.city, 
				p.state, 
				p.bedrooms, 
				p.bathrooms,
				pi.image_url,
				pi.is_primary,
				pv.viewed_at
			FROM 
				property_views pv
			JOIN 
				properties p ON pv.property_id = p.id
			LEFT JOIN 
				property_images pi ON p.id = pi.property_id AND pi.is_primary = true
			WHERE 
				pv.user_id = $1
			ORDER BY 
				pv.viewed_at DESC
			LIMIT 5
		`, [decoded.id]);
		
		// Group by property and format data
		const propertyMap = new Map();
		recentViews.forEach((row: any) => {
			if (!propertyMap.has(row.id)) {
				propertyMap.set(row.id, {
					id: row.id,
					title: row.title,
					price: row.price,
					location: `${row.city}, ${row.state}`,
					image: row.image_url || '/placeholder-property.jpg',
					bedrooms: row.bedrooms,
					bathrooms: row.bathrooms,
					viewedAt: new Date(row.viewed_at).toLocaleDateString()
				});
			}
		});
		
		return json({ views: Array.from(propertyMap.values()) });

	} catch (error) {
		console.error('Error fetching recent property views:', error);
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
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { property_id } = await request.json();
		if (!property_id) {
			return json({ error: 'Property ID is required' }, { status: 400 });
		}

		// Record property view
		await db.query(`
			INSERT INTO property_views (user_id, property_id) 
			VALUES ($1, $2)
		`, [decoded.id, property_id]);
		
		// Update the views_count on the property
		await db.query(`
			UPDATE properties
			SET views_count = views_count + 1
			WHERE id = $1
		`, [property_id]);
		
		return json({ success: true });

	} catch (error) {
		console.error('Error recording property view:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
