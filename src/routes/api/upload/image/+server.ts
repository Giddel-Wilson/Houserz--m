import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.slice(7);
		const decoded = verifyToken(token);
		
		if (!decoded) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { image, folder = 'houserz/temp' } = await request.json();

		if (!image) {
			return json({ error: 'No image provided' }, { status: 400 });
		}

		// Validate base64 image format
		if (!image.startsWith('data:image/')) {
			return json({ error: 'Invalid image format' }, { status: 400 });
		}

		// For now, just return the base64 image as the URL
		return json({
			success: true,
			image: {
				url: image, // Return base64 as URL
				publicId: `temp_${Date.now()}`,
				width: 800,
				height: 600,
				format: 'jpeg'
			}
		});

	} catch (error) {
		console.error('Image upload error:', error);
		return json({ error: 'Failed to upload image' }, { status: 500 });
	}
};
