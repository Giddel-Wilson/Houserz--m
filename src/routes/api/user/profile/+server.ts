import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ request }) => {
  try {
    console.log('[Profile Debug] GET endpoint called');
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No authorization token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('[Profile Debug] Auth successful for user:', decoded.id);
    
    // Fetch user from database
    console.log('[Profile Debug] Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profileImage: true,
        bio: true,
        phone: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('[Profile Debug] User fetched successfully:', user.id);
    return json({ user });
    
  } catch (error) {
    console.error('[Profile Debug] Error:', error);
    return json({ error: 'Server error: ' + (error as Error).message }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    console.log('[Profile Debug] PUT endpoint called');
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No authorization token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse request body
    const updateData = await request.json();
    console.log('[Profile Debug] Update data received:', updateData);
    
    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        fullName: updateData.fullName,
        bio: updateData.bio,
        phone: updateData.phone,
        profileImage: updateData.profileImage
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profileImage: true,
        bio: true,
        phone: true,
        createdAt: true
      }
    });
    
    console.log('[Profile Debug] User updated successfully:', updatedUser.id);
    return json({ user: updatedUser });
    
  } catch (error) {
    console.error('[Profile Debug] Error:', error);
    return json({ error: 'Server error: ' + (error as Error).message }, { status: 500 });
  }
};
