/**
 * FANZ Database Client
 *
 * Unified database client for all 94 FANZ platforms
 * Handles connection pooling, multi-tenancy, and query execution
 *
 * Usage:
 *   import { FanzDatabaseClient } from '@fanz/database-client';
 *   const db = new FanzDatabaseClient({
 *     platformId: 'cougarfanz',
 *     tenantId: '00000000-0000-0000-0000-000000000001'
 *   });
 */

import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';

export interface FanzDatabaseConfig {
  // Platform context (required for multi-tenancy)
  platformId: string;
  tenantId: string;

  // Database connection
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;

  // Connection pool settings
  poolMin?: number;
  poolMax?: number;
  poolIdleTimeoutMs?: number;
  poolConnectionTimeoutMs?: number;

  // SSL settings
  ssl?: boolean;
  sslRejectUnauthorized?: boolean;
  sslCa?: string;

  // Query settings
  statementTimeoutMs?: number;
  queryTimeoutMs?: number;

  // Logging
  logQueries?: boolean;
  logSlowQueries?: boolean;
  slowQueryThresholdMs?: number;
}

export interface QueryOptions {
  // User context (for Row Level Security)
  userId?: string;
  userRole?: string;

  // Service context
  serviceName?: string;

  // Query behavior
  transaction?: boolean;
  timeout?: number;
}

export class FanzDatabaseClient {
  private pool: Pool;
  private config: FanzDatabaseConfig;

  constructor(config: FanzDatabaseConfig) {
    this.config = {
      // Defaults
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fanz_ecosystem',
      user: process.env.DB_USER || 'svc_platform_api',
      password: process.env.DB_PASSWORD,
      poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
      poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
      poolIdleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000'),
      poolConnectionTimeoutMs: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '30000'),
      ssl: process.env.DB_SSL_ENABLED === 'true',
      sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      statementTimeoutMs: parseInt(process.env.DB_STATEMENT_TIMEOUT || '60000'),
      queryTimeoutMs: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      logQueries: process.env.DB_LOG_QUERIES === 'true',
      logSlowQueries: process.env.DB_LOG_SLOW_QUERIES !== 'false',
      slowQueryThresholdMs: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
      ...config
    };

    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      min: this.config.poolMin,
      max: this.config.poolMax,
      idleTimeoutMillis: this.config.poolIdleTimeoutMs,
      connectionTimeoutMillis: this.config.poolConnectionTimeoutMs,
      statement_timeout: this.config.statementTimeoutMs,
      query_timeout: this.config.queryTimeoutMs,
      application_name: this.config.platformId,
    };

    if (this.config.ssl) {
      poolConfig.ssl = {
        rejectUnauthorized: this.config.sslRejectUnauthorized,
        ...(this.config.sslCa && { ca: this.config.sslCa })
      };
    }

    this.pool = new Pool(poolConfig);

    // Set up connection handler to set session variables
    this.pool.on('connect', async (client: PoolClient) => {
      await this.setSessionContext(client);
    });

    // Error handler
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  /**
   * Set session context for multi-tenancy and RLS
   */
  private async setSessionContext(client: PoolClient, options?: QueryOptions): Promise<void> {
    const queries = [
      `SET app.platform_id = '${this.config.platformId}'`,
      `SET app.tenant_id = '${this.config.tenantId}'`,
    ];

    if (options?.userId) {
      queries.push(`SET app.current_user_id = '${options.userId}'`);
    }

    if (options?.userRole) {
      queries.push(`SET app.user_role = '${options.userRole}'`);
    }

    if (options?.serviceName) {
      queries.push(`SET app.service_name = '${options.serviceName}'`);
    }

    for (const query of queries) {
      await client.query(query);
    }
  }

  /**
   * Execute a query
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      // Get client from pool
      const client = await this.pool.connect();

      try {
        // Set session context if options provided
        if (options) {
          await this.setSessionContext(client, options);
        }

        // Execute query
        const result = await client.query<T>(text, params);

        const duration = Date.now() - startTime;

        // Log queries
        if (this.config.logQueries ||
            (this.config.logSlowQueries && duration > (this.config.slowQueryThresholdMs || 1000))) {
          console.log('[DB Query]', {
            platform: this.config.platformId,
            query: text.substring(0, 200),
            params: params?.length,
            duration: `${duration}ms`,
            rows: result.rowCount
          });
        }

        return result;
      } finally {
        client.release();
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[DB Error]', {
        platform: this.config.platformId,
        query: text.substring(0, 200),
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options?: QueryOptions
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      // Set session context
      if (options) {
        await this.setSessionContext(client, options);
      }

      // Begin transaction
      await client.query('BEGIN');

      try {
        // Execute callback
        const result = await callback(client);

        // Commit transaction
        await client.query('COMMIT');

        return result;
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get a single row
   */
  async queryOne<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<T | null> {
    const result = await this.query<T>(text, params, options);
    return result.rows[0] || null;
  }

  /**
   * Get multiple rows
   */
  async queryMany<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<T[]> {
    const result = await this.query<T>(text, params, options);
    return result.rows;
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Helper class for common database operations
 */
export class FanzDatabaseHelpers {
  constructor(private db: FanzDatabaseClient) {}

  /**
   * Insert a record and return it
   */
  async insert<T extends QueryResultRow = any>(
    table: string,
    data: Record<string, any>,
    options?: QueryOptions
  ): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.db.queryOne<T>(query, values, options);
    if (!result) {
      throw new Error('Insert failed: no rows returned');
    }
    return result;
  }

  /**
   * Update a record and return it
   */
  async update<T extends QueryResultRow = any>(
    table: string,
    id: string,
    data: Record<string, any>,
    options?: QueryOptions
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${table.includes('.') ? table.split('.')[1] : table}_id = $1
      RETURNING *
    `;

    return this.db.queryOne<T>(query, [id, ...values], options);
  }

  /**
   * Delete a record
   */
  async delete(
    table: string,
    id: string,
    options?: QueryOptions
  ): Promise<boolean> {
    const query = `
      DELETE FROM ${table}
      WHERE ${table.includes('.') ? table.split('.')[1] : table}_id = $1
    `;

    const result = await this.db.query(query, [id], options);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Soft delete (set deleted_at)
   */
  async softDelete(
    table: string,
    id: string,
    options?: QueryOptions
  ): Promise<boolean> {
    const query = `
      UPDATE ${table}
      SET deleted_at = NOW()
      WHERE ${table.includes('.') ? table.split('.')[1] : table}_id = $1
      AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id], options);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Find by ID
   */
  async findById<T extends QueryResultRow = any>(
    table: string,
    id: string,
    options?: QueryOptions
  ): Promise<T | null> {
    const query = `
      SELECT * FROM ${table}
      WHERE ${table.includes('.') ? table.split('.')[1] : table}_id = $1
      AND (deleted_at IS NULL OR deleted_at IS NOT NULL)
      LIMIT 1
    `;

    return this.db.queryOne<T>(query, [id], options);
  }

  /**
   * Find many with optional filters
   */
  async findMany<T extends QueryResultRow = any>(
    table: string,
    filters?: Record<string, any>,
    limit?: number,
    offset?: number,
    options?: QueryOptions
  ): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (filters && Object.keys(filters).length > 0) {
      const whereClause = Object.keys(filters).map((key, i) => {
        params.push(filters[key]);
        return `${key} = $${i + 1}`;
      }).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    if (limit) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(offset);
      query += ` OFFSET $${params.length}`;
    }

    return this.db.queryMany<T>(query, params, options);
  }

  /**
   * Count records with optional filters
   */
  async count(
    table: string,
    filters?: Record<string, any>,
    options?: QueryOptions
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params: any[] = [];

    if (filters && Object.keys(filters).length > 0) {
      const whereClause = Object.keys(filters).map((key, i) => {
        params.push(filters[key]);
        return `${key} = $${i + 1}`;
      }).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    const result = await this.db.queryOne<{ count: string }>(query, params, options);
    return parseInt(result?.count || '0');
  }
}

/**
 * Factory function to create database client
 */
export function createDatabaseClient(config: FanzDatabaseConfig): FanzDatabaseClient {
  return new FanzDatabaseClient(config);
}

/**
 * Export types
 */
export type { PoolClient, QueryResult, QueryResultRow } from 'pg';
