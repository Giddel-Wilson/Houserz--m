import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth';
import { db } from '$lib/db';

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.slice(7);
		const decoded = verifyToken(token);
		
		if (!decoded || decoded.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { status } = await request.json();
		const agentId = parseInt(params.id!);

		if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		// Update agent profile status
		await db.query(
			'UPDATE agent_profiles SET status = $1, updated_at = NOW() WHERE agent_id = $2',
			[status, agentId]
		);

		// Log admin action
		await db.query(
			'INSERT INTO admin_logs (admin_id, action, target_type, target_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
			[decoded.userId, `Agent ${status}`, 'agent', agentId]
		);

		return json({ 
			success: true, 
			message: `Agent ${status} successfully` 
		});

	} catch (error) {
		console.error('Error updating agent status:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
