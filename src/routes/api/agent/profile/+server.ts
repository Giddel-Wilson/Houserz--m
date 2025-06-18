import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { prisma } from '$lib/database';
import type { RequestHandler } from './$types';

// GET - Load agent profile
export const GET: RequestHandler = async ({ request }) => {
  try {
    console.log('[Agent Profile API] GET request received');
    const authHeader = request.headers.get('authorization');
    console.log('[Agent Profile API] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'none');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    console.log('[Agent Profile API] Token decoded:', decoded ? `ID: ${decoded.id}, Role: ${decoded.role}` : 'invalid token');
    
    if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
      return json({ error: 'Agent access required' }, { status: 403 });
    }

    const userId = decoded.id;
    console.log('[Agent Profile API] Fetching agent with ID:', userId);

    // Get user basic info
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          profileImage: true,
          role: true,
          createdAt: true,
          bio: true,
          licenseNumber: true,
          yearsExperience: true,
          specialization: true
        }
      });
      console.log('[Agent Profile API] User found:', user ? 'yes' : 'no');
      
      if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
      }
    } catch (error: any) {
      console.error('[Agent Profile API] Database error:', error);
      return json({ error: 'Database error: ' + (error.message || 'Unknown error') }, { status: 500 });
    }

    // Format agent profile data
    const profile = {
      id: user.id,
      bio: user.bio || "Experienced real estate agent committed to helping you find your perfect home.",
      whatsapp_link: user.phone ? `https://wa.me/${user.phone.replace(/[^\d]/g, '')}` : "",
      phone_number: user.phone || "",
      license_number: user.licenseNumber || "REA/LS/2024/000000", // Fallback if not set
      years_experience: user.yearsExperience || 1,
      specialization: user.specialization ? JSON.parse(user.specialization) : ['Residential Sales', 'Residential Rentals'],
      profile_picture_url: user.profileImage || "",
      is_approved: true,
      created_at: user.createdAt.toISOString()
    };

    return json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error('[Agent Profile API] Error loading profile:', error);
    return json({ error: 'Failed to load profile: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
};

// PUT - Update agent profile
export const PUT: RequestHandler = async ({ request }) => {
  try {
    console.log('[Agent Profile API] PUT request received');
    const authHeader = request.headers.get('authorization');
    console.log('[Agent Profile API] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'none');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    console.log('[Agent Profile API] Token decoded:', decoded ? `ID: ${decoded.id}, Role: ${decoded.role}` : 'invalid token');
    
    if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
      return json({ error: 'Agent access required' }, { status: 403 });
    }

    const userId = decoded.id;
    const profileData = await request.json();
    console.log('[Agent Profile API] Update data received:', profileData);

    // Validate required fields
    if (!profileData.bio || !profileData.phone_number || !profileData.license_number) {
      return json({ error: 'Please fill in all required fields' }, { status: 400 });
    }

    if (!profileData.specialization || profileData.specialization.length === 0) {
      return json({ error: 'Please select at least one specialization' }, { status: 400 });
    }

    // Update user basic info
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: profileData.phone_number,
          profileImage: profileData.profile_picture_url,
          bio: profileData.bio,
          licenseNumber: profileData.license_number,
          yearsExperience: profileData.years_experience,
          specialization: JSON.stringify(profileData.specialization),
          updatedAt: new Date()
        }
      });
      console.log('[Agent Profile API] Profile updated successfully');
    } catch (error: any) {
      console.error('[Agent Profile API] Database update error:', error);
      return json({ error: 'Database update error: ' + (error.message || 'Unknown error') }, { status: 500 });
    }

    return json({
      success: true,
      message: "Agent profile updated successfully",
      profile: {
        ...profileData,
        id: userId,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Agent Profile API] Error updating profile:', error);
    return json({ error: 'Failed to update profile: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
};
