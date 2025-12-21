/**
 * Database Connection Setup Template
 *
 * Copy this file to your platform's src/lib/db.ts
 *
 * Usage:
 *   import { db, dbHelpers } from './lib/db';
 *
 *   const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [userId]);
 *   const newPost = await dbHelpers.insert('posts.posts', { ... });
 */

import { createDatabaseClient, FanzDatabaseHelpers } from './database/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['PLATFORM_ID', 'TENANT_ID', 'DB_PASSWORD'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

/**
 * Main database client instance
 */
export const db = createDatabaseClient({
  platformId: process.env.PLATFORM_ID!,
  tenantId: process.env.TENANT_ID!,
});

/**
 * Database helper functions for common operations
 */
export const dbHelpers = new FanzDatabaseHelpers(db);

/**
 * Check database health
 * Call this on application startup to ensure database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const isHealthy = await db.healthCheck();

    if (!isHealthy) {
      console.error('Database health check failed');
      return false;
    }

    const stats = db.getPoolStats();
    console.log('Database connected successfully', {
      platform: process.env.PLATFORM_ID,
      poolStats: stats
    });

    return true;
  } catch (error) {
    console.error('Database health check error:', error);
    return false;
  }
}

/**
 * Graceful shutdown handler
 * Call this when your application is shutting down
 */
export async function closeDatabaseConnections(): Promise<void> {
  console.log('Closing database connections...');
  await db.close();
  console.log('Database connections closed');
}

/**
 * Get current database statistics
 */
export function getDatabaseStats() {
  return {
    poolStats: db.getPoolStats(),
    platform: process.env.PLATFORM_ID,
    tenant: process.env.TENANT_ID
  };
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeDatabaseConnections();
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await closeDatabaseConnections();
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  await closeDatabaseConnections();
  process.exit(1);
});
