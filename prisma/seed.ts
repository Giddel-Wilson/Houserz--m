import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@houserz.com' },
    update: {},
    create: {
      email: 'admin@houserz.com',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isVerified: true,
      isActive: true
    }
  });

  // Create agent user
  const agent = await prisma.user.upsert({
    where: { email: 'agent@houserz.com' },
    update: {},
    create: {
      email: 'agent@houserz.com',
      passwordHash: agentPassword,
      fullName: 'John Agent',
      phone: '+234-801-234-5678',
      role: 'AGENT',
      company: 'Prime Properties Ltd',
      licenseNumber: 'RE-LAG-2023-001',
      yearsExperience: 5,
      specialization: 'Residential Properties',
      isVerified: true,
      isActive: true
    }
  });

  // Create client user
  const client = await prisma.user.upsert({
    where: { email: 'client@houserz.com' },
    update: {},
    create: {
      email: 'client@houserz.com',
      passwordHash: clientPassword,
      fullName: 'Jane Client',
      phone: '+234-802-345-6789',
      role: 'CLIENT',
      isVerified: true,
      isActive: true
    }
  });

  // Create additional test users
  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@houserz.com' },
    update: {},
    create: {
      email: 'agent2@houserz.com',
      passwordHash: agentPassword,
      fullName: 'Sarah Wilson',
      phone: '+234-803-456-7890',
      role: 'AGENT',
      company: 'Elite Properties',
      licenseNumber: 'RE-LAG-2023-002',
      yearsExperience: 8,
      specialization: 'Commercial Properties',
      isVerified: true,
      isActive: true,
      isOnline: true
    }
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'buyer@houserz.com' },
    update: {},
    create: {
      email: 'buyer@houserz.com',
      passwordHash: clientPassword,
      fullName: 'Michael Thompson',
      phone: '+234-804-567-8901',
      role: 'CLIENT',
      isVerified: true,
      isActive: true,
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    }
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'renter@houserz.com' },
    update: {},
    create: {
      email: 'renter@houserz.com',
      passwordHash: clientPassword,
      fullName: 'Emily Davis',
      phone: '+234-805-678-9012',
      role: 'CLIENT',
      isVerified: true,
      isActive: true,
      isOnline: true
    }
  });

  // Create sample properties
  const properties = [
    {
      title: 'The Pinnacle at Highland Park',
      description: 'Luxury 4-bedroom duplex in a serene environment with modern amenities including swimming pool, gym, and 24/7 security.',
      propertyType: 'Duplex',
      listingType: 'SALE',
      price: 85000000.00,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2500,
      address: '15 Highland Park Estate, Victoria Island',
      city: 'Lagos',
      state: 'Lagos State',
      features: JSON.stringify(['Swimming Pool', 'Gym', '24/7 Security', 'Generator', 'Parking Space', 'Garden']),
      status: 'ACTIVE',
      isFeatured: true,
      agentId: agent.id
    },
    {
      title: 'Modern Family Home Abuja',
      description: 'Spacious 5-bedroom house perfect for families. Located in a quiet neighborhood with excellent schools nearby.',
      propertyType: 'House',
      listingType: 'SALE',
      price: 120000000.00,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      address: '8 Maitama District',
      city: 'Abuja',
      state: 'FCT',
      features: JSON.stringify(['Garage', 'Garden', 'Security', 'Generator', 'Water Treatment']),
      status: 'ACTIVE',
      isFeatured: true,
      agentId: agent2.id
    },
    {
      title: 'Executive Apartment Port Harcourt',
      description: 'Well-furnished 4-bedroom apartment in the heart of Port Harcourt with city views.',
      propertyType: 'Apartment',
      listingType: 'RENT',
      price: 2500000.00,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2800,
      address: '12 GRA Phase 2',
      city: 'Port Harcourt',
      state: 'Rivers State',
      features: JSON.stringify(['Furnished', 'City View', 'Elevator', 'Parking', 'Security']),
      status: 'ACTIVE',
      isFeatured: false,
      agentId: agent.id
    },
    {
      title: 'Cozy Bungalow Ibadan',
      description: 'Beautiful 3-bedroom bungalow in a peaceful area of Ibadan.',
      propertyType: 'Bungalow',
      listingType: 'SALE',
      price: 75000000.00,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 2200,
      address: '25 Bodija Estate',
      city: 'Ibadan',
      state: 'Oyo State',
      features: JSON.stringify(['Garden', 'Parking', 'Security', 'Bore Hole']),
      status: 'ACTIVE',
      isFeatured: false,
      agentId: agent2.id
    },
    {
      title: 'Luxury Villa Kano',
      description: 'Magnificent 5-bedroom villa with premium finishes and landscaped gardens.',
      propertyType: 'Villa',
      listingType: 'SALE',
      price: 110000000.00,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3500,
      address: '5 Nassarawa GRA',
      city: 'Kano',
      state: 'Kano State',
      features: JSON.stringify(['Swimming Pool', 'Garden', 'Garage', 'Security', 'Generator']),
      status: 'ACTIVE',
      isFeatured: false,
      agentId: agent.id
    },
    {
      title: 'Modern Duplex Enugu',
      description: 'Contemporary 4-bedroom duplex in the coal city with modern amenities.',
      propertyType: 'Duplex',
      listingType: 'RENT',
      price: 1800000.00,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2600,
      address: '18 Independence Layout',
      city: 'Enugu',
      state: 'Enugu State',
      features: JSON.stringify(['Parking', 'Security', 'Generator', 'Water Supply']),
      status: 'ACTIVE',
      isFeatured: false,
      agentId: agent2.id
    }
  ];

  for (const propertyData of properties) {
    const property = await prisma.property.create({
      data: propertyData
    });

    // Add sample property images
    await prisma.propertyImage.create({
      data: {
        propertyId: property.id,
        imageUrl: `/house-${property.id}.jpg`,
        altText: `${property.title} - Main View`,
        isPrimary: true,
        displayOrder: 1
      }
    });
  }

  // Create sample viewing requests
  const properties_list = await prisma.property.findMany();
  if (properties_list.length > 0) {
    await prisma.viewingRequest.create({
      data: {
        propertyId: properties_list[0].id,
        clientId: client.id,
        agentId: agent.id,
        preferredDate: new Date('2025-02-15'),
        preferredTime: '14:00',
        message: 'I would like to view this property this weekend. Very interested in the swimming pool area.',
        status: 'PENDING'
      }
    });

    await prisma.viewingRequest.create({
      data: {
        propertyId: properties_list[1].id,
        clientId: client2.id,
        agentId: agent2.id,
        preferredDate: new Date('2025-02-20'),
        preferredTime: '10:00',
        message: 'I am interested in viewing this family home. Please let me know your availability.',
        status: 'CONFIRMED'
      }
    });
  }

  // Create sample conversations and messages
  if (properties_list.length > 0) {
    // Conversation 1: Client to Agent about property
    const conversation1 = await prisma.conversation.create({
      data: {
        initiatorId: client.id,
        receiverId: agent.id,
        propertyId: properties_list[0].id,
        subject: 'Inquiry about The Pinnacle at Highland Park',
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation1.id,
        senderId: client.id,
        content: 'Hello, I am very interested in this property. Can you provide more details about the payment terms?',
        messageType: 'TEXT',
        isDelivered: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation1.id,
        senderId: agent.id,
        content: 'Thank you for your interest! The property can be purchased with a 30% down payment and flexible payment plans available. Would you like to schedule a viewing?',
        messageType: 'TEXT',
        isDelivered: true,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      }
    });

    // Conversation 2: Client2 to Agent2 about rental
    const conversation2 = await prisma.conversation.create({
      data: {
        initiatorId: client2.id,
        receiverId: agent2.id,
        propertyId: properties_list[2].id,
        subject: 'Rental inquiry for Port Harcourt apartment',
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation2.id,
        senderId: client2.id,
        content: 'Hi, I am looking for a furnished apartment in Port Harcourt. Is this property still available for rent?',
        messageType: 'TEXT',
        isDelivered: true,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation2.id,
        senderId: agent2.id,
        content: 'Yes, it is still available! The rent is ₦2.5M per year with a 2-year lease minimum. The apartment is fully furnished and includes utilities.',
        messageType: 'TEXT',
        isDelivered: true,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      }
    });

    // Conversation 3: Agent to Agent discussion
    const conversation3 = await prisma.conversation.create({
      data: {
        initiatorId: agent.id,
        receiverId: agent2.id,
        subject: 'Market trends discussion',
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation3.id,
        senderId: agent.id,
        content: 'Hey Sarah, have you noticed the increased demand for rental properties in Lagos recently?',
        messageType: 'TEXT',
        isDelivered: true,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation3.id,
        senderId: agent2.id,
        content: 'Absolutely! I think it\'s due to the new infrastructure projects. Are you considering adjusting your rental prices?',
        messageType: 'TEXT',
        isDelivered: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      }
    });

    // Create an admin broadcast
    const adminBroadcast = await prisma.adminBroadcast.create({
      data: {
        senderId: admin.id,
        subject: 'Platform Update Notice',
        content: 'We have updated our messaging system with new real-time features. Please report any issues to support.',
        messageType: 'NOTIFICATION',
        recipientIds: JSON.stringify([agent.id, agent2.id, client.id, client2.id, client3.id])
      }
    });

    // Create admin message conversations for each user
    const allUsers = [agent, agent2, client, client2, client3];
    for (const user of allUsers) {
      const adminConversation = await prisma.conversation.create({
        data: {
          initiatorId: admin.id,
          receiverId: user.id,
          subject: 'Platform Update Notice',
          adminRestricted: true,
          canReceiverReply: false,
          lastMessageAt: new Date()
        }
      });

      await prisma.message.create({
        data: {
          conversationId: adminConversation.id,
          senderId: admin.id,
          content: 'We have updated our messaging system with new real-time features. Please report any issues to support.',
          messageType: 'NOTIFICATION',
          isSystemMessage: true,
          adminBroadcastId: adminBroadcast.id,
          isDelivered: true,
          isRead: false
        }
      });
    }
  }

  console.log('Database seeded successfully!');
  console.log('='.repeat(50));
  console.log('Login credentials:');
  console.log('Admin: admin@houserz.com / admin123');
  console.log('Agent 1: agent@houserz.com / agent123 (John Agent)');
  console.log('Agent 2: agent2@houserz.com / agent123 (Sarah Wilson)');
  console.log('Client 1: client@houserz.com / client123 (Jane Client)');
  console.log('Client 2: buyer@houserz.com / client123 (Michael Thompson)');
  console.log('Client 3: renter@houserz.com / client123 (Emily Davis)');
  console.log('='.repeat(50));
  console.log('Sample data created:');
  console.log('- 6 properties (mix of sale and rental)');
  console.log('- 2 viewing requests');
  console.log('- 3 conversations with messages');
  console.log('- 1 admin broadcast to all users');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
