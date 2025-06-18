import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';

// POST - Schedule a property viewing
export async function POST({ request, params }) {
	try {
		const { date, time, message, phone } = await request.json();
		const propertyId = parseInt(params.id);

		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, JWT_SECRET);
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const userId = decoded.userId;

		// Validate required fields
		if (!date || !time || !phone) {
			return json({ error: 'Date, time, and phone number are required' }, { status: 400 });
		}

		// Validate date is not in the past
		const scheduledDateTime = new Date(`${date}T${time}`);
		if (scheduledDateTime <= new Date()) {
			return json({ error: 'Scheduled date and time must be in the future' }, { status: 400 });
		}

		// Get property and agent info
		const propertyQuery = `
			SELECT p.*, u.email as agent_email, u.full_name as agent_name
			FROM properties p
			JOIN users u ON p.agent_id = u.id
			WHERE p.id = $1
		`;
		const propertyResult = await db.query(propertyQuery, [propertyId]);
		
		if (propertyResult.rows.length === 0) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		const property = propertyResult.rows[0];

		// Insert viewing request
		const insertQuery = `
			INSERT INTO property_viewings (
				property_id, user_id, agent_id, scheduled_date, scheduled_time,
				user_message, user_phone, status, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
			RETURNING *
		`;

		const values = [
			propertyId,
			userId,
			property.agent_id,
			date,
			time,
			message || '',
			phone,
			'pending'
		];

		const result = await db.query(insertQuery, values);
		const viewing = result.rows[0];

		// TODO: Send email notification to agent
		// TODO: Send SMS notification to agent (optional)

		return json({
			success: true,
			viewing: {
				id: viewing.id,
				property_id: viewing.property_id,
				scheduled_date: viewing.scheduled_date,
				scheduled_time: viewing.scheduled_time,
				status: viewing.status,
				property_title: property.title,
				agent_name: property.agent_name
			}
		});

	} catch (error) {
		console.error('Error scheduling viewing:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

// GET - Get viewing requests for a property (agent use)
export async function GET({ params, url }) {
	try {
		const propertyId = parseInt(params.id);
		const status = url.searchParams.get('status') || 'all';

		let query = `
			SELECT 
				pv.*,
				u.full_name as user_name,
				u.email as user_email,
				p.title as property_title
			FROM property_viewings pv
			JOIN users u ON pv.user_id = u.id
			JOIN properties p ON pv.property_id = p.id
			WHERE pv.property_id = $1
		`;

		const values = [propertyId];

		if (status !== 'all') {
			query += ' AND pv.status = $2';
			values.push(status);
		}

		query += ' ORDER BY pv.scheduled_date DESC, pv.scheduled_time DESC';

		const result = await db.query(query, values);

		return json({
			success: true,
			viewings: result.rows
		});

	} catch (error) {
		console.error('Error fetching viewings:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
