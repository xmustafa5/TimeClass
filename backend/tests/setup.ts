import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy the dev database for testing
const DEV_DB_PATH = path.join(__dirname, '..', 'dev.db');
const TEST_DB_PATH = path.join(__dirname, '..', 'test.db');

// Clean up and copy database
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

// Copy dev.db to test.db to get the schema
if (fs.existsSync(DEV_DB_PATH)) {
  fs.copyFileSync(DEV_DB_PATH, TEST_DB_PATH);
}

const adapter = new PrismaBetterSqlite3({
  url: `file:${TEST_DB_PATH}`,
});

export const testPrisma = new PrismaClient({ adapter });

// Clean up tables before each test
beforeEach(async () => {
  // Delete in correct order to respect foreign keys
  await testPrisma.scheduleEntry.deleteMany();
  await testPrisma.section.deleteMany();
  await testPrisma.grade.deleteMany();
  await testPrisma.teacher.deleteMany();
  await testPrisma.room.deleteMany();
  await testPrisma.period.deleteMany();
});

afterAll(async () => {
  await testPrisma.$disconnect();

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
