import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const requests = await (prisma as any).accessRequest.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Failed to fetch access requests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { doctorName, clinicName, phone } = body

    if (!doctorName || !clinicName || !phone) {
      return NextResponse.json({ error: 'Bütün xanaları doldurun' }, { status: 400 })
    }

    const newRequest = await (prisma as any).accessRequest.create({
      data: {
        doctorName: doctorName.trim(),
        clinicName: clinicName.trim(),
        phone: phone.trim(),
        status: 'PENDING'
      }
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create access request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID və status tələb olunur' }, { status: 400 })
    }

    const updated = await (prisma as any).accessRequest.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update access request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
