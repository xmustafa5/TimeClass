import { beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy the dev database for testing
const DEV_DB_PATH = path.join(__dirname, '..', 'dev.db');
const TEST_DB_PATH = path.join(__dirname, '..', 'test.db');

// Clean up and copy database BEFORE any prisma imports
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

// Copy dev.db to test.db to get the schema
if (fs.existsSync(DEV_DB_PATH)) {
  fs.copyFileSync(DEV_DB_PATH, TEST_DB_PATH);
}

// Override DATABASE_URL to point to test database BEFORE importing prisma
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

// Now import the shared prisma client - it will use the test database
// This must come AFTER setting DATABASE_URL
const { prisma, disconnectPrisma } = await import('../src/lib/prisma.js');

// Export for test files to use
export const testPrisma = prisma;

// Clean up tables before each test
beforeEach(async () => {
  // Delete in correct order to respect foreign keys
  await testPrisma.scheduleEntry.deleteMany();
  await testPrisma.section.deleteMany();
  await testPrisma.grade.deleteMany();
  await testPrisma.teacher.deleteMany();
  await testPrisma.period.deleteMany();
});

afterAll(async () => {
  await disconnectPrisma();

  // Clean up test database file with retry for EBUSY errors
  const cleanupTestDb = (retries = 3) => {
    try {
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EBUSY' && retries > 0) {
        // Wait a bit and retry
        setTimeout(() => cleanupTestDb(retries - 1), 100);
      }
      // Ignore cleanup errors - the file will be overwritten on next test run
    }
  };
  cleanupTestDb();
});
