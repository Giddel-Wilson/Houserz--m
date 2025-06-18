import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth';
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ request, url }) => {
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

		const limit = parseInt(url.searchParams.get('limit') || '10');

		// Get recent admin activities
		const query = `
			SELECT aa.*, u.full_name as admin_name
			FROM admin_activities aa
			JOIN users u ON aa.admin_id = u.id
			ORDER BY aa.created_at DESC
			LIMIT $1
		`;

		const { rows } = await db.query(query, [limit]);

		return json({
			activities: rows.map((activity: any) => ({
				id: activity.id,
				admin_id: activity.admin_id,
				admin_name: activity.admin_name,
				action: activity.action,
				target_type: activity.target_type,
				target_id: activity.target_id,
				details: activity.details,
				created_at: activity.created_at
			}))
		});

	} catch (error) {
		console.error('Error fetching admin activities:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
