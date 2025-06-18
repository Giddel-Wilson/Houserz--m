import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken, verifyPassword, hashPassword } from '$lib/auth';
import { db } from '$lib/db';

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.slice(7);
		const decoded = verifyToken(token);
		
		if (!decoded) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { current_password, new_password } = await request.json();

		if (!current_password || !new_password) {
			return json({ error: 'Current password and new password are required' }, { status: 400 });
		}

		if (new_password.length < 6) {
			return json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
		}

		// Get user's current password hash
		const userResult = await db.query(
			'SELECT password_hash FROM users WHERE id = $1',
			[decoded.id]
		);

		if (userResult.rows.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = userResult.rows[0];

		// Verify current password
		const isCurrentPasswordValid = await verifyPassword(current_password, user.password_hash);
		if (!isCurrentPasswordValid) {
			return json({ error: 'Current password is incorrect' }, { status: 400 });
		}

		// Hash new password
		const newPasswordHash = await hashPassword(new_password);

		// Update password
		await db.query(
			'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
			[newPasswordHash, decoded.id]
		);

		return json({
			message: 'Password changed successfully'
		});

	} catch (error) {
		console.error('Error changing password:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
