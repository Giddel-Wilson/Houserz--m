import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '$lib/auth.js';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { participantId, subject, propertyId } = await request.json();

    if (!participantId) {
      return json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Check if conversation already exists between these users
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { initiatorId: decoded.id, receiverId: participantId },
          { initiatorId: participantId, receiverId: decoded.id }
        ],
        ...(propertyId && { propertyId })
      },
      include: {
        initiator: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        property: {
          select: { id: true, title: true }
        }
      }
    });

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          initiatorId: decoded.id,
          receiverId: participantId,
          subject: subject || 'New Conversation',
          propertyId: propertyId || null
        },
        include: {
          initiator: {
            select: { id: true, fullName: true, email: true, role: true }
          },
          receiver: {
            select: { id: true, fullName: true, email: true, role: true }
          },
          property: {
            select: { id: true, title: true }
          }
        }
      });
    }

    return json({ 
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
