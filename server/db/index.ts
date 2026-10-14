import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL environment variable is missing. Database queries will fail.');
}

const sql = neon(connectionString || '');

export const db = drizzle(sql, { schema });
export * from './schema';
