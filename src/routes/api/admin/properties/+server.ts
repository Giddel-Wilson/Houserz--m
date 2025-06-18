import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		console.log('[Admin Properties API] GET request received');
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			console.log('[Admin Properties API] No authorization header');
			return json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		console.log('[Admin Properties API] Token received, verifying...');
		
		let decoded;
		try {
			decoded = jwt.verify(token, JWT_SECRET) as any;
			console.log('[Admin Properties API] Token verified:', { userId: decoded.userId, role: decoded.role });
		} catch (error) {
			console.log('[Admin Properties API] Token verification failed:', error);
			return json({ error: 'Invalid token' }, { status: 401 });
		}
		
		if (!decoded || decoded.role !== 'ADMIN') {
			console.log('[Admin Properties API] User not admin:', decoded?.role);
			return json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
		}

		console.log('[Admin Properties API] Fetching properties from database...');

		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const search = url.searchParams.get('search') || '';
		const status = url.searchParams.get('status') || '';
		const type = url.searchParams.get('type') || '';

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
				{ address: { contains: search, mode: 'insensitive' } },
				{ city: { contains: search, mode: 'insensitive' } },
				{ state: { contains: search, mode: 'insensitive' } }
			];
		}
		
		if (status && status !== 'all') {
			where.status = status.toUpperCase();
		}
		
		if (type && type !== 'all') {
			where.listingType = type.toUpperCase();
		}

		const [properties, total] = await Promise.all([
			prisma.property.findMany({
				where,
				include: {
					agent: {
						select: {
							id: true,
							fullName: true,
							email: true,
							phone: true
						}
					}
				},
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.property.count({ where })
		]);

		console.log(`[Admin Properties API] Found ${properties.length} properties (total: ${total})`);

		// Transform properties to match frontend expectations
		const transformedProperties = properties.map(property => ({
			...property,
			type: property.listingType, // Map listingType to type for frontend
			location: `${property.city}, ${property.state}` // Create location field from city and state
		}));

		return json({
			properties: transformedProperties,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});

	} catch (error) {
		console.error('[Admin Properties API] Error:', error);
		return json({ error: 'Failed to fetch properties' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, status, adminNote } = await request.json();

		if (!id || !status) {
			return json({ error: 'Property ID and status are required' }, { status: 400 });
		}

		const updatedProperty = await prisma.property.update({
			where: { id: parseInt(id) },
			data: {
				status,
				updatedAt: new Date()
			},
			include: {
				agent: {
					select: {
						id: true,
						fullName: true,
						email: true
					}
				}
			}
		});

		// Log admin action
		await prisma.adminActivity.create({
			data: {
				adminId: locals.user.id,
				action: 'PROPERTY_STATUS_UPDATE',
				targetType: 'PROPERTY',
				targetId: id.toString(),
				details: JSON.stringify({
					propertyId: id,
					newStatus: status,
					adminNote: adminNote || null,
					propertyTitle: updatedProperty.title
				})
			}
		});

		return json({ 
			success: true, 
			property: updatedProperty,
			message: `Property status updated to ${status}` 
		});

	} catch (error) {
		console.error('Property update error:', error);
		return json({ error: 'Failed to update property' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return json({ error: 'Property ID is required' }, { status: 400 });
		}

		const property = await prisma.property.findUnique({
			where: { id: parseInt(id) },
			select: { title: true, agentId: true }
		});

		if (!property) {
			return json({ error: 'Property not found' }, { status: 404 });
		}

		await prisma.property.delete({
			where: { id: parseInt(id) }
		});

		// Log admin action
		await prisma.adminActivity.create({
			data: {
				adminId: locals.user.id,
				action: 'PROPERTY_DELETE',
				targetType: 'PROPERTY',
				targetId: id,
				details: JSON.stringify({
					propertyId: parseInt(id),
					propertyTitle: property.title,
					propertyOwnerId: property.agentId
				})
			}
		});

		return json({ 
			success: true, 
			message: 'Property deleted successfully' 
		});

	} catch (error) {
		console.error('Property delete error:', error);
		return json({ error: 'Failed to delete property' }, { status: 500 });
	}
};
