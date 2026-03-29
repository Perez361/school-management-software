// lib/prisma.ts  — updated to support Tauri production DB path
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

function getDbPath(): string {
  // In Tauri production, the DB_PATH env is set by lib.rs
  // pointing to the bundled school.db in the resource directory.
  if (process.env.DB_PATH) {
    return process.env.DB_PATH
  }
  // Dev / plain Next.js: use the project root
  return path.join(process.cwd(), 'school.db')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbPath = getDbPath()
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma