import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const owners = await prisma.owner.findMany()
  const results = []

  for (const owner of owners) {
    if (owner.phone.includes('18488550753')) {
      // It's the test number! Let's update it forcefully.
      await prisma.owner.update({
        where: { id: owner.id },
        data: { phone: '+18488550753' }
      })
      results.push(`Updated ${owner.id} from ${owner.phone} to +18488550753`)
    }
  }

  return NextResponse.json({ success: true, results, owners: owners.map(o => o.phone) })
}
