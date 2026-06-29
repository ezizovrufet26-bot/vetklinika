import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.patient.updateMany({
    where: { clinicStatus: 'NONE' },
    data: { clinicStatus: 'WAITING' }
  })
  console.log('Statuses updated!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
