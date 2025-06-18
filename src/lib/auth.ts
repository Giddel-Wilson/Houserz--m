import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Create Prisma client with Neon-optimized settings
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
  isVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    console.log(`[Auth] Verifying token: ${token.substring(0, 10)}...`);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`[Auth] Token valid. Decoded:`, decoded);
    return decoded;
  } catch (error) {
    console.error(`[Auth] Token verification failed:`, error);
    return null;
  }
}

export async function createUser(
  fullName: string,
  email: string,
  password: string,
  phone: string,
  role: 'CLIENT' | 'AGENT' = 'CLIENT'
): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  try {
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        phone,
        role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });
    
    return user;
  } catch (error: any) {
    console.error('Prisma error in createUser:', error);
    
    // Handle Neon-specific connection errors
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      throw new Error('Database connection failed. Please try again in a moment.');
    }
    
    if (error.code === 'P2002') {
      throw new Error('Email already exists');
    }
    
    throw new Error('Failed to create user account');
  }
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        isVerified: true,
      },
    });
    
    return user;
  } catch (error: any) {
    console.error('Prisma error in getUserByEmail:', error);
    
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      throw new Error('Database connection failed');
    }
    
    throw new Error('Failed to fetch user');
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });
    
    return user;
  } catch (error: any) {
    console.error('Prisma error in getUserById:', error);
    
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      throw new Error('Database connection failed');
    }
    
    throw new Error('Failed to fetch user');
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) return null;
  
  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
