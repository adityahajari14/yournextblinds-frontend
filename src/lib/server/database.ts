import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isVercel = Boolean(process.env.VERCEL);

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isCloudDb = connectionString.includes('render.com') ||
  connectionString.includes('onrender.com') ||
  connectionString.includes('neon.tech') ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  // In serverless environments, keep pool size small to avoid exhausting DB connections.
  max: isVercel ? 2 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: isVercel ? 20000 : 10000,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Reuse Prisma client across warm invocations in all environments.
globalForPrisma.prisma = prisma;
