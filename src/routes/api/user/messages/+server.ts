import { json } from '@sveltejs/kit';
import { prisma } from '$lib/database.js';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    console.log('Messages API (GET): Starting request to fetch conversations');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Messages API (GET): Authentication required');
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET! || 'your-secret-key') as any;
    // The user ID is stored as 'id' in the JWT token, not 'userId'
    const userId = decoded.id;
    console.log('Messages API (GET): Authenticated user ID:', userId);

    // Get query parameters
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    console.log('Messages API (GET): Query params:', { limit, offset });
    
    // Optional property filter
    const propertyId = url.searchParams.get('property_id');
    const propertyFilter = propertyId ? { propertyId: parseInt(propertyId) } : {};
    console.log('Messages API (GET): Property filter:', propertyFilter);

    // Fetch user's conversations (both initiated and received)
    console.log('Messages API (GET): Fetching conversations for user:', userId);
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { initiatorId: userId, ...propertyFilter },
          { receiverId: userId, ...propertyFilter }
        ]
      },
      include: {
        initiator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            listingType: true,
            price: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { initiatorId: userId },
            { receiverId: userId }
          ]
        },
        senderId: { not: userId },
        isRead: false
      }
    });

    console.log(`Messages API (GET): Found ${conversations.length} conversations`);
    
    return json({
      conversations: conversations.map(conversation => ({
        id: conversation.id,
        subject: conversation.subject,
        property: conversation.property,
        propertyId: conversation.propertyId,
        otherUser: conversation.initiatorId === userId ? conversation.receiver : conversation.initiator,
        lastMessage: conversation.messages[0] ? {
          content: conversation.messages[0].content,
          createdAt: conversation.messages[0].createdAt,
          sender: conversation.messages[0].sender
        } : null,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive
      })),
      unreadCount,
      total: conversations.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('Messages API: Starting message creation process');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Messages API: Authentication required');
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET! || 'your-secret-key') as any;
    const userId = decoded.id; // ID stored in JWT
    console.log('Messages API: Authenticated user ID:', userId);

    const body = await request.json();
    const { recipient_id, subject, message, property_id } = body;
    console.log('Messages API: Request body:', { recipient_id, subject, message, property_id });

    if (!recipient_id || !message) {
      console.log('Messages API: Missing required fields');
      return json({ error: 'Recipient ID and message are required' }, { status: 400 });
    }

    const recipientIdNum = parseInt(recipient_id);
    const propertyIdNum = property_id ? parseInt(property_id) : null;

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientIdNum }
    });

    if (!recipient) {
      console.log('Messages API: Recipient not found:', recipientIdNum);
      return json({ error: 'Recipient not found' }, { status: 404 });
    }
    
    // Verify property exists and get property data if property_id is provided
    let propertyData = null;
    if (propertyIdNum) {
      try {
        propertyData = await prisma.property.findUnique({
          where: { id: propertyIdNum },
          select: { 
            id: true, 
            title: true, 
            city: true, 
            state: true,
            listingType: true,
            price: true
          }
        });
        
        if (!propertyData) {
          console.log('Messages API: Property not found:', propertyIdNum);
          return json({ error: 'Property not found' }, { status: 404 });
        }
        
        console.log('Messages API: Property verified:', propertyData.title);
      } catch (propertyError) {
        console.error('Error finding property:', propertyError);
        // Continue without property data
      }
    }
    
    // Check for existing conversation
    console.log('Messages API: Checking for existing conversation');
    let conversation = null;
    
    try {
      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            {
              initiatorId: userId,
              receiverId: recipientIdNum,
              ...(propertyIdNum ? { propertyId: propertyIdNum } : {})
            },
            {
              initiatorId: recipientIdNum,
              receiverId: userId,
              ...(propertyIdNum ? { propertyId: propertyIdNum } : {})
            }
          ]
        }
      });
      
      console.log('Messages API: Existing conversation found?', !!conversation, 
                  conversation ? `ID: ${conversation.id}` : '');
    } catch (findError) {
      console.error('Error finding conversation:', findError);
    }

    // If no conversation exists, create one
    if (!conversation) {
      try {
        console.log('Messages API: Creating new conversation');
        
        // Use a descriptive subject that includes property info if available
        let conversationSubject = subject || 'Chat';
        if (propertyData && !subject) {
          const location = propertyData.city || propertyData.state || '';
          const price = propertyData.price ? `₦${Number(propertyData.price).toLocaleString()}` : '';
          conversationSubject = `Inquiry: ${propertyData.title || 'Property'} ${location ? `in ${location}` : ''} ${price ? `(${price})` : ''}`.trim();
        }
        
        conversation = await prisma.conversation.create({
          data: {
            initiatorId: userId,
            receiverId: recipientIdNum,
            subject: conversationSubject,
            ...(propertyIdNum ? { propertyId: propertyIdNum } : {}),
          }
        });
        
        console.log('Messages API: New conversation created with ID:', conversation.id);
      } catch (createError) {
        console.error('Error creating conversation:', createError);
        return json({ error: 'Failed to create conversation' }, { status: 500 });
      }
    }

    if (!conversation) {
      return json({ error: 'Failed to find or create conversation' }, { status: 500 });
    }

    // Create the message
    let newMessage;
    try {
      console.log('Messages API: Creating message in conversation ID:', conversation.id);
      
      // Prepend property info to first message if it's property related
      let messageContent = message;
      if (propertyData && !conversation.lastMessageAt) {
        // This is the first message in a property inquiry
        messageContent = `[Regarding property: ${propertyData.title || 'Property Inquiry'}]\n\n${message}`;
      }
      
      newMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: messageContent
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });
      
      console.log('Messages API: Message created with ID:', newMessage.id);
      
      // Update conversation last message time
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });
    } catch (messageError) {
      console.error('Error creating message:', messageError);
      return json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Get property info to return
    let propertyInfo = null;
    if (propertyIdNum) {
      try {
        const property = await prisma.property.findUnique({
          where: { id: propertyIdNum },
          select: { id: true, title: true }
        });
        if (property) {
          propertyInfo = property;
        }
      } catch (error) {
        console.log('Error fetching property info (non-critical):', error);
      }
    }

    return json({
      message: 'Message sent successfully',
      conversationId: conversation.id,
      messageData: {
        id: newMessage.id,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
        sender: newMessage.sender,
        property: propertyInfo
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return json({ error: 'Failed to send message' }, { status: 500 });
  }
};
