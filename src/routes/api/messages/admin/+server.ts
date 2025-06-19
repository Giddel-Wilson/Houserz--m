import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth.js';
import { prisma } from '$lib/database.js';
import type { RequestHandler } from './$types.js';

// Get all users that admin can message (excluding other admins)
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'ADMIN')) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');

    const whereClause: any = {
      role: { not: 'ADMIN' },
      isActive: true
    };

    if (role && ['CLIENT', 'AGENT'].includes(role)) {
      whereClause.role = role;
    }

    if (search && search.trim().length > 0) {
      whereClause.OR = [
        { fullName: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
        company: true,
        createdAt: true
      },
      orderBy: { fullName: 'asc' },
      take: 100 // Limit results for performance
    });

    return json({ users });

  } catch (error: any) {
    console.error('Error fetching users for admin messaging:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Handle admin message broadcasting
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'ADMIN')) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      recipientIds, 
      content, 
      subject, 
      messageType = 'NOTIFICATION',
      isSystemMessage = true 
    } = await request.json();

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return json({ error: 'Recipient IDs are required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return json({ error: 'Message content is required' }, { status: 400 });
    }

    const adminId = decoded.id;
    
    // Create admin broadcast record
    const adminBroadcast = await prisma.adminBroadcast.create({
      data: {
        senderId: adminId,
        content: content.trim(),
        subject: subject || 'Admin Notification',
        messageType,
        recipientIds: JSON.stringify(recipientIds)
      }
    });

    const results = [];

    // Send message to each recipient
    for (const recipientId of recipientIds) {
      try {
        // Verify recipient exists and is not an admin
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { id: true, role: true, isActive: true }
        });

        if (!recipient || !recipient.isActive) {
          results.push({ 
            recipientId,
            success: false, 
            error: 'Recipient not found or inactive' 
          });
          continue;
        }

        if (recipient.role === 'ADMIN') {
          results.push({ 
            recipientId, 
            success: false, 
            error: 'Cannot send admin notifications to other admins' 
          });
          continue;
        }

        // Check if admin conversation already exists
        let conversation = await prisma.conversation.findFirst({
          where: {
            initiatorId: adminId,
            receiverId: recipientId,
            adminRestricted: true
          }
        });

        // Create new conversation if it doesn't exist
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              initiatorId: adminId,
              receiverId: recipientId,
              subject: subject || 'Admin Notification',
              adminRestricted: true,
              canReceiverReply: false
            }
          });
        }

        // Create the message
        const message = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: adminId,
            content: content.trim(),
            messageType,
            isSystemMessage,
            isDelivered: true,
            adminBroadcastId: adminBroadcast.id
          }
        });

        // Update conversation's last message timestamp
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() }
        });

        results.push({ 
          recipientId, 
          success: true, 
          conversationId: conversation.id,
          messageId: message.id 
        });

      } catch (error) {
        console.error(`Error sending message to recipient ${recipientId}:`, error);
        results.push({ 
          recipientId, 
          success: false, 
          error: 'Failed to send message' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return json({ 
      message: `Messages sent successfully to ${successCount} recipients. ${failureCount} failed.`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error: any) {
    console.error('Error sending admin messages:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
