import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// TƏHLÜKƏSİZLİK: connection string YALNIZ env-dən gəlir.
// Kodda hardcoded parol saxlamaq — DB-nin tam ifşası deməkdir.
//
// LAZY İNİT: instansiya ilk sorğuda yaradılır ki, `next build`
// (page data collection) DATABASE_URL olmadan da keçsin — env yalnız
// runtime-da tələb olunur. Vercel kimi platformalarda build mühitində
// env olmaya bilər.

// Dev-də hot-reload zamanı yeni connection pool yaranmasın deyə
// instansiyanı globalThis-də saxlayırıq
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL mühit dəyişəni təyin edilməyib. Lokalda .env faylına, ' +
        'deploy mühitində (Vercel/Railway) isə Environment Variables bölməsinə əlavə edin.'
    )
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })

  globalForPrisma.prisma = client
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
