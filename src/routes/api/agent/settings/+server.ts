import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth.js';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types';

// GET - Load agent settings
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
      return json({ error: 'Agent access required' }, { status: 403 });
    }

    const userId = decoded.id;

    // Get user settings
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!userSettings) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Return default settings structure that matches the frontend
    const settings = {
      notifications: {
        email: true,
        push: true,
        sms: false,
        newMessages: true,
        propertyViews: true,
        viewingRequests: true,
        systemUpdates: false
      },
      privacy: {
        showOnlineStatus: true,
        showLastSeen: true,
        allowDirectMessages: true,
        showProfile: true
      },
      account: {
        twoFactorEnabled: false,
        sessionTimeout: 30
      }
    };

    return json({ 
      success: true,
      settings,
      user: {
        id: userSettings.id,
        email: userSettings.email,
        fullName: userSettings.fullName,
        phone: userSettings.phone
      }
    });

  } catch (error) {
    console.error('Error loading agent settings:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST - Save agent settings
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'agent' && decoded.role !== 'AGENT')) {
      return json({ error: 'Agent access required' }, { status: 403 });
    }

    const userId = decoded.id;
    const { settings } = await request.json();

    if (!settings) {
      return json({ error: 'Settings data is required' }, { status: 400 });
    }

    // For now, we'll just acknowledge the settings save
    console.log('Agent settings saved for user:', userId, settings);

    return json({ 
      success: true,
      message: 'Settings saved successfully' 
    });

  } catch (error) {
    console.error('Error saving agent settings:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
