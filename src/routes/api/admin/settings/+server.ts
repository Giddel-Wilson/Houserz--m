import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '$lib/auth.js';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ request, locals }) => {
	try {
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const decoded = verifyToken(token);
		
		if (!decoded || decoded.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Mock settings data
		const settings = {
			siteName: 'Houserz',
			siteDescription: 'Find your perfect property',
			adminEmail: 'admin@houserz.com',
			supportEmail: 'support@houserz.com',
			smsProvider: 'twilio',
			emailProvider: 'sendgrid',
			maintenanceMode: false,
			userRegistration: true,
			agentApproval: true,
			maxFileSize: 10,
			allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
			securitySettings: {
				requireEmailVerification: true,
				passwordMinLength: 8,
				sessionTimeout: 24,
				maxLoginAttempts: 5
			},
			notificationSettings: {
				emailNewAgent: true,
				emailNewProperty: true,
				emailNewMessage: true,
				smsEnabled: false
			}
		};

		return json(settings);

	} catch (error: any) {
		console.error('Settings API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const decoded = verifyToken(token);
		
		if (!decoded || decoded.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const settings = await request.json();
		
		// Here you would save the settings to database
		console.log('Saving settings:', settings);

		return json({ message: 'Settings saved successfully' });

	} catch (error: any) {
		console.error('Settings save error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
