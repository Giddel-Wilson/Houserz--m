import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET
import type { RequestHandler } from './$types';

// GET - Get agent's property viewing requests
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Verify JWT token
		let decoded: any;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const agentId = decoded.id; // Using id instead of userId
		const status = url.searchParams.get('status') || 'all';
		const propertyId = url.searchParams.get('property_id');

		let query = `
			SELECT 
				vr.*,
				u.full_name as user_name,
				u.email as user_email,
				p.title as property_title,
				p.city as property_city,
				p.state as property_state,
				p.address as property_address,
				p.price as property_price,
				p.property_type,
				pi.image_url as property_image
			FROM viewing_requests vr
			JOIN users u ON vr.client_id = u.id
			JOIN properties p ON vr.property_id = p.id
			LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = true
			WHERE vr.agent_id = $1
		`;

		const values = [agentId];

		if (status !== 'all') {
			query += ' AND UPPER(vr.status) = UPPER($2)';
			values.push(status);
		}

		if (propertyId) {
			query += ` AND vr.property_id = $${values.length + 1}`;
			values.push(propertyId);
		}

		query += ' ORDER BY vr.preferred_date ASC';

		const { rows } = await db.query(query, values);

		// Format the data for frontend
		const formattedViewings = rows.map((row: any) => ({
			id: row.id,
			property_id: row.property_id,
			property_title: row.property_title,
			property_location: `${row.property_address}, ${row.property_city}, ${row.property_state}`,
			property_image: row.property_image || '/placeholder-property.jpg',
			property_price: row.property_price,
			property_type: row.property_type,
			client_id: row.client_id,
			client_name: row.user_name,
			client_email: row.user_email,
			preferred_date: row.preferred_date,
			preferred_time: row.preferred_time,
			message: row.message,
			agent_notes: row.agent_notes,
			status: row.status,
			created_at: row.created_at
		}));

		return json({
			success: true,
			viewings: formattedViewings
		});

	} catch (error) {
		console.error('Error fetching agent viewings:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

// PUT - Update viewing status or add notes
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { viewingId, action, status, notes } = await request.json();

		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Verify JWT token
		let decoded: any;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const agentId = decoded.id;

		// Validate action
		if (!['update_status', 'add_notes'].includes(action)) {
			return json({ error: 'Invalid action' }, { status: 400 });
		}

		// Check if viewing belongs to agent
		const checkQuery = `
			SELECT * FROM viewing_requests 
			WHERE id = $1 AND agent_id = $2
		`;
		const { rows: checkRows } = await db.query(checkQuery, [viewingId, agentId]);

		if (checkRows.length === 0) {
			return json({ error: 'Viewing not found or access denied' }, { status: 404 });
		}

		let updateQuery;
		let values;

		if (action === 'update_status') {
			if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
				return json({ error: 'Invalid status' }, { status: 400 });
			}

			updateQuery = `
				UPDATE viewing_requests 
				SET status = $1, updated_at = NOW()
				WHERE id = $2 AND agent_id = $3
				RETURNING *
			`;
			values = [status.toUpperCase(), viewingId, agentId];
		} else if (action === 'add_notes') {
			updateQuery = `
				UPDATE viewing_requests 
				SET agent_notes = $1, updated_at = NOW()
				WHERE id = $2 AND agent_id = $3
				RETURNING *
			`;
			values = [notes || '', viewingId, agentId];
		}

		const { rows } = await db.query(updateQuery, values);

		// TODO: Send email/SMS notification to user about status update

		return json({
			success: true,
			viewing: rows[0]
		});

	} catch (error) {
		console.error('Error updating viewing:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
