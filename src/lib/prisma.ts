import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Tək bir instansiya yaratmaqla eyni anda minlərlə qoşulmanın qarşısını alırıq
export const prisma = new PrismaClient({ adapter })
