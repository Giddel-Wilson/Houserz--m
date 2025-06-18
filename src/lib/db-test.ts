import { prisma } from './database';

/**
 * Function to test database connectivity and log detailed information
 * about any connection issues
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('[DB Test] Testing database connection...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('[DB Test] Connection successful:', result);
    
    return true;
  } catch (error) {
    console.error('[DB Test] Connection failed:', error);
    
    // Check for common connection issues
    if (error.message?.includes("Can't reach database server")) {
      console.error('[DB Test] Database server appears to be unreachable.');
    } else if (error.code === 'P1001') {
      console.error('[DB Test] Database server unreachable (Prisma P1001).');
    } else if (error.code === 'P1003') {
      console.error('[DB Test] Database access denied (Prisma P1003). Check credentials.');
    } else if (error.code === 'P1012') {
      console.error('[DB Test] Schema validation error (Prisma P1012). Schema may be outdated.');
    }
    
    return false;
  }
}

/**
 * Function to test a specific table/model in the database
 */
export async function testDatabaseTable(tableName: string): Promise<boolean> {
  try {
    console.log(`[DB Test] Testing database table: ${tableName}`);
    
    // Use Prisma's raw query capability to count records
    const query = `SELECT COUNT(*) FROM "${tableName}"`;
    const result = await prisma.$queryRaw`${query}`;
    
    console.log(`[DB Test] Table "${tableName}" is accessible. Record count:`, result);
    return true;
  } catch (error) {
    console.error(`[DB Test] Table "${tableName}" test failed:`, error);
    
    if (error.code === 'P2010') {
      console.error(`[DB Test] Raw query failed (Prisma P2010). Table "${tableName}" may not exist.`);
    }
    
    return false;
  }
}
