import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.kqeyimnpgkxshetyqsqo:VetKlinika2026!%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Tək bir instansiya yaratmaqla eyni anda minlərlə qoşulmanın qarşısını alırıq
export const prisma = new PrismaClient({ adapter })
