import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { db } from '$lib/db';
import type { RequestHandler } from './$types';

// JWT_SECRET will be accessed via process.env.JWT_SECRET

// PATCH - Update a viewing request status
export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const userId = decoded.userId;
		const viewingId = parseInt(params.id);
		const { status } = await request.json();

		// Validate status
		const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
		if (!validStatuses.includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		// Check if viewing belongs to user
		const checkQuery = `
			SELECT id FROM property_viewings 
			WHERE id = $1 AND user_id = $2
		`;
		
		const checkResult = await db.query(checkQuery, [viewingId, userId]);
		
		if (checkResult.rows.length === 0) {
			return json({ error: 'Viewing not found or unauthorized' }, { status: 404 });
		}

		// Update viewing status
		const updateQuery = `
			UPDATE property_viewings 
			SET status = $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3
			RETURNING *
		`;

		const result = await db.query(updateQuery, [status, viewingId, userId]);

		return json({
			success: true,
			viewing: result.rows[0]
		});

	} catch (error) {
		console.error('Error updating viewing:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE - Cancel a viewing request
export const DELETE: RequestHandler = async ({ request, params }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const userId = decoded.userId;
		const viewingId = parseInt(params.id);

		// Check if viewing belongs to user and is cancellable
		const checkQuery = `
			SELECT id, status FROM property_viewings 
			WHERE id = $1 AND user_id = $2
		`;
		
		const checkResult = await db.query(checkQuery, [viewingId, userId]);
		
		if (checkResult.rows.length === 0) {
			return json({ error: 'Viewing not found or unauthorized' }, { status: 404 });
		}

		const viewing = checkResult.rows[0];
		if (viewing.status === 'completed') {
			return json({ error: 'Cannot cancel completed viewing' }, { status: 400 });
		}

		// Update viewing status to cancelled
		const updateQuery = `
			UPDATE property_viewings 
			SET status = 'cancelled', updated_at = NOW()
			WHERE id = $1 AND user_id = $2
			RETURNING *
		`;

		const result = await db.query(updateQuery, [viewingId, userId]);

		return json({
			success: true,
			viewing: result.rows[0]
		});

	} catch (error) {
		console.error('Error cancelling viewing:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
