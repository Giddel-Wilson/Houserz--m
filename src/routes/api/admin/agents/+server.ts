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

		const limit = parseInt(url.searchParams.get('limit') || '20');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Get agents with their properties and info
		const query = `
			SELECT 
				u.id, 
				u.full_name,
				u.email, 
				u.created_at, 
				u.is_verified,
				u.license_number, 
				u.company, 
				u.phone, 
				u.bio,
				u.years_experience,
				u.specialization,
				COUNT(p.id) as property_count
			FROM users u
			LEFT JOIN properties p ON u.id = p.agent_id
			WHERE UPPER(u.role) = 'AGENT'
			GROUP BY 
				u.id, 
				u.full_name, 
				u.email, 
				u.created_at,
				u.is_verified,
				u.license_number, 
				u.company, 
				u.phone, 
				u.bio,
				u.years_experience,
				u.specialization
			ORDER BY u.created_at DESC
			LIMIT $1 OFFSET $2
		`;

		const { rows } = await db.query(query, [limit, offset]);

		// Get total count
		const { rows: countRows } = await db.query(
			'SELECT COUNT(*) as total FROM users WHERE UPPER(role) = UPPER($1)',
			['AGENT']
		);

		return json({
			agents: rows.map((row: any) => ({
				id: row.id,
				full_name: row.full_name,
				email: row.email,
				created_at: row.created_at,
				is_verified: row.is_verified,
				property_count: parseInt(row.property_count || '0'),
				agent_profile: {
					license_number: row.license_number,
					company: row.company,
					phone: row.phone,
					bio: row.bio,
					years_experience: row.years_experience,
					specialization: row.specialization
				}
			})),
			total: parseInt(countRows[0]?.total || '0'),
			limit: limit,
			offset: offset
		});

	} catch (error) {
		console.error('Error fetching agents:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
