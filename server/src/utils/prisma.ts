import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance of PrismaClient.
 * This ensures we don't exhaust the database connection limit
 * by creating a new client on every request during development.
 */
const prisma = new PrismaClient();

export default prisma;
