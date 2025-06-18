import { json } from '@sveltejs/kit';
import { createUser, authenticateUser, generateToken } from '$lib/auth.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, email, password, phone, role } = await request.json();

    // Validate input
    if (!name || !email || !password || !phone) {
      return json({ error: 'Name, email, password, and phone are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    console.log('Attempting to create user:', { name, email, phone, role });

    // Create user - use fullName instead of name, and proper role values
    const userRole = role === 'agent' ? 'AGENT' : 'CLIENT';
    const user = await createUser(name, email, password, phone, userRole);
    
    console.log('User created successfully:', user);

    // Generate token
    const token = generateToken(user);

    return json({
      user: {
        id: user.id,
        full_name: user.fullName, // Use consistent field name with profile API
        fullName: user.fullName,  // Keep for backward compatibility
        name: user.fullName,      // Also provide as 'name' for components that check this
        email: user.email,
        role: user.role.toLowerCase() // Convert to lowercase for frontend compatibility
      },
      token
    });

  } catch (error: any) {
    console.error('Registration error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    if (error.code === 'P2002' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return json({ error: 'Email already exists' }, { status: 409 });
    }
    
    return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
};
