import { json } from '@sveltejs/kit';
import { authenticateUser, generateToken } from '$lib/auth';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);
    
    if (!user) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate token
    const token = generateToken(user);

    return json({
      user: {
        id: user.id,
        full_name: user.fullName, // Use consistent field name with profile API
        fullName: user.fullName,  // Keep for backward compatibility
        name: user.fullName,      // Also provide as 'name' for components that check this
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
