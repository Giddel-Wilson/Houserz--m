import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth';
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ request }) => {
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

		// Get admin stats
		const { rows: totalUsersResult } = await db.query('SELECT COUNT(*) as count FROM users');
		
		const { rows: totalAgentsResult } = await db.query(`
			SELECT COUNT(*) as count FROM users
			WHERE UPPER(role) = 'AGENT' AND is_verified = true
		`);

		const { rows: pendingAgentsResult } = await db.query(`
			SELECT COUNT(*) as count FROM users
			WHERE UPPER(role) = 'AGENT' AND is_verified = false
		`);

		const { rows: totalPropertiesResult } = await db.query('SELECT COUNT(*) as count FROM properties');
		
		const { rows: activePropertiesResult } = await db.query(
			'SELECT COUNT(*) as count FROM properties WHERE UPPER(status) = UPPER($1)',
			['ACTIVE']
		);

		const { rows: totalMessagesResult } = await db.query('SELECT COUNT(*) as count FROM messages');

		return json({
			totalUsers: parseInt(totalUsersResult[0]?.count || '0'),
			totalAgents: parseInt(totalAgentsResult[0]?.count || '0'),
			pendingAgents: parseInt(pendingAgentsResult[0]?.count || '0'),
			totalProperties: parseInt(totalPropertiesResult[0]?.count || '0'),
			activeProperties: parseInt(activePropertiesResult[0]?.count || '0'),
			totalMessages: parseInt(totalMessagesResult[0]?.count || '0')
		});

	} catch (error) {
		console.error('Error fetching admin stats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
