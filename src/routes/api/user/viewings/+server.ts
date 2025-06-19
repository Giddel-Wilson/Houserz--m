import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
// JWT_SECRET will be accessed via process.env.JWT_SECRET
import { prisma } from '$lib/database';

export const GET: RequestHandler = async ({ request }) => {
	try {
		console.log('Viewings API: Starting request...');
		
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			console.log('Viewings API: No auth header');
			return json({ viewings: [] });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
			console.log('Viewings API: Token decoded, user ID:', decoded.id);
		} catch (error) {
			console.log('Viewings API: Invalid token');
			return json({ viewings: [] });
		}

		// Try to get viewing requests, but return empty array if table doesn't exist
		try {
			const viewings = await prisma.viewingRequest.findMany({
				where: { clientId: decoded.id },
				include: {
					property: {
						select: {
							id: true,
							title: true,
							address: true,
							city: true,
							state: true
						}
					},
					agent: {
						select: {
							id: true,
							fullName: true,
							email: true,
							phone: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			});

			console.log(`Viewings API: Found ${viewings.length} viewings`);
			return json({ viewings });

		} catch (dbError) {
			console.log('Viewings API: ViewingRequest table might not exist, returning empty array');
			return json({ viewings: [] });
		}

	} catch (error) {
		console.error('Viewings API Error:', error);
		return json({ viewings: [] }); // Return empty array instead of error
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let decoded: any;
		
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET!);
		} catch (error) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const body = await request.json();
		const { property_id, preferred_date, message } = body;

		if (!property_id || !preferred_date) {
			return json({ 
				error: 'Property ID and preferred date are required' 
			}, { status: 400 });
		}

		// Verify property exists
		const property = await prisma.property.findUnique({
			where: { id: parseInt(property_id) },
			include: {
				agent: {
					select: {
						id: true,
						fullName: true
					}
				}
			}
		});

		if (!property) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		// Create viewing request
		const viewingRequest = await prisma.viewingRequest.create({
			data: {
				clientId: decoded.id,
				propertyId: parseInt(property_id),
				agentId: property.agent.id,
				preferredDate: new Date(preferred_date),
				message: message || '',
				status: 'PENDING'
			},
			include: {
				property: {
					select: {
						id: true,
						title: true,
						address: true,
						city: true,
						state: true
					}
				},
				agent: {
					select: {
						id: true,
						fullName: true,
						email: true,
						phone: true
					}
				}
			}
		});

		return json({
			message: 'Viewing request submitted successfully',
			viewing: viewingRequest
		});

	} catch (error) {
		console.error('Error creating viewing request:', error);
		return json({ error: 'Failed to create viewing request' }, { status: 500 });
	}
};
