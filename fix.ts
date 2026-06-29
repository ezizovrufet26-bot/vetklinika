import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

import dotenv from 'dotenv'
dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const result = await prisma.patient.updateMany({
    where: { clinicStatus: 'NONE' },
    data: { clinicStatus: 'WAITING' }
  })
  console.log(`Updated ${result.count} patients!`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
