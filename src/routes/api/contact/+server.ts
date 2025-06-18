import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate input
    if (!name || !email || !message) {
      return json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Log the contact form submission (in production, you would save to database or send email)
    console.log('Contact form submission:', {
      name,
      email,
      subject: subject || 'No subject',
      message,
      timestamp: new Date().toISOString()
    });

    // In a real application, you would:
    // 1. Save the message to the database
    // 2. Send an email notification to your team
    // 3. Send a confirmation email to the user
    
    // For now, we'll just return success
    return json({ 
      message: 'Thank you for your message! We will get back to you soon.',
      success: true 
    });

  } catch (error: any) {
    console.error('Contact form error:', error);
    return json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
};
