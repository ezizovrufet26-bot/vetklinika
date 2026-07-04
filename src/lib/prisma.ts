import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// TƏHLÜKƏSİZLİK: connection string YALNIZ env-dən gəlir.
// Kodda hardcoded parol saxlamaq — DB-nin tam ifşası deməkdir.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    'DATABASE_URL mühit dəyişəni təyin edilməyib. .env faylına DATABASE_URL əlavə edin.'
  )
}

// Dev-də hot-reload zamanı yeni connection pool yaranmasın deyə
// instansiyanı globalThis-də saxlayırıq
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
