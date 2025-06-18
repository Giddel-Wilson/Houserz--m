import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { prisma } from '$lib/database';
import type { RequestHandler } from './$types';

// GET - Load admin profile
export const GET: RequestHandler = async ({ request }) => {
  try {
    console.log('[Admin Profile API] GET request received');
    const authHeader = request.headers.get('authorization');
    console.log('[Admin Profile API] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'none');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    console.log('[Admin Profile API] Token decoded:', decoded ? `ID: ${decoded.id}, Role: ${decoded.role}` : 'invalid token');
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'ADMIN')) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const userId = decoded.id;
    console.log('[Admin Profile API] Fetching admin with ID:', userId);

    // Get admin user info
    let admin;
    try {
      admin = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          profileImage: true,
          bio: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          lastSeen: true
        }
      });

      console.log('[Admin Profile API] Admin found:', admin ? 'yes' : 'no');
      
      if (!admin) {
        return json({ error: 'Admin not found' }, { status: 404 });
      }
    } catch (error: any) {
      console.error('[Admin Profile API] Database error:', error);
      return json({ error: 'Database error: ' + (error.message || 'Unknown error') }, { status: 500 });
    }

    // Fetch admin activity statistics (to be implemented with actual data)
    const activityStats = {
      properties_approved: 25,
      agents_verified: 12,
      users_managed: 85,
      total_activities: 132
    };

    return json({
      success: true,
      profile: {
        id: admin.id,
        full_name: admin.fullName,
        email: admin.email,
        phone: admin.phone || '',
        profile_image: admin.profileImage || '',
        bio: admin.bio || '',
        role: admin.role,
        is_verified: admin.isVerified,
        created_at: admin.createdAt.toISOString(),
        last_seen: admin.lastSeen ? admin.lastSeen.toISOString() : null,
        activity_stats: activityStats
      }
    });

  } catch (error: any) {
    console.error('[Admin Profile API] Error loading profile:', error);
    return json({ error: 'Failed to load profile: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
};

// PUT - Update admin profile
export const PUT: RequestHandler = async ({ request }) => {
  try {
    console.log('[Admin Profile API] PUT request received');
    const authHeader = request.headers.get('authorization');
    console.log('[Admin Profile API] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'none');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    console.log('[Admin Profile API] Token decoded:', decoded ? `ID: ${decoded.id}, Role: ${decoded.role}` : 'invalid token');
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'ADMIN')) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const userId = decoded.id;
    const profileData = await request.json();
    console.log('[Admin Profile API] Update data received:', profileData);

    // Validate required fields
    if (!profileData.full_name) {
      return json({ error: 'Full name is required' }, { status: 400 });
    }

    // Update admin user data
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: profileData.full_name,
          phone: profileData.phone || null,
          profileImage: profileData.profile_image || null,
          bio: profileData.bio || null,
          updatedAt: new Date(),
          lastSeen: new Date()
        }
      });
      console.log('[Admin Profile API] Profile updated successfully');
    } catch (error: any) {
      console.error('[Admin Profile API] Database update error:', error);
      return json({ error: 'Database update error: ' + (error.message || 'Unknown error') }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: userId,
        full_name: profileData.full_name,
        email: profileData.email, // Not updated
        phone: profileData.phone || '',
        profile_image: profileData.profile_image || '',
        bio: profileData.bio || '',
        role: decoded.role,
        is_verified: true,
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Admin Profile API] Error updating profile:', error);
    return json({ error: 'Failed to update profile: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
};
