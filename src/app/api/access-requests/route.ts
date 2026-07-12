import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { normalizeIdentifier } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

const APP_URL = process.env.APP_URL || 'https://vetklinika-aqkn.vercel.app'

/** GET/PATCH yalnız SUPERADMIN/ADMIN üçün; POST landing formasından ictimaidir */
async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
    return null
  }
  return session
}

/** Oxunaqlı müvəqqəti şifrə: qarışdırıcı simvollar (0/O, 1/l/I) çıxarılıb */
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(10)
  let pass = ''
  for (let i = 0; i < 10; i++) pass += alphabet[bytes[i] % alphabet.length]
  return pass
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Bu əməliyyat üçün admin girişi tələb olunur' }, { status: 403 })
  }

  try {
    const requests = await prisma.accessRequest.findMany({
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

    const newRequest = await prisma.accessRequest.create({
      data: {
        doctorName: doctorName.trim(),
        clinicName: clinicName.trim(),
        phone: phone.trim(),
        status: 'PENDING'
      }
    })

    // Müraciətin qeydə alındığını dərhal WhatsApp ilə təsdiqlə (best-effort — uğursuzluq müraciəti pozmasın)
    try {
      await sendWhatsAppMessage(
        newRequest.phone,
        `🐾 *VetKlinika*\n\nSalam ${newRequest.doctorName}! "${newRequest.clinicName}" üçün müraciətiniz qəbul edildi.\nAdminlərimiz qısa zamanda yoxlayıb təsdiqləyəcək — təsdiqləndikdən sonra giriş məlumatlarınızı bu nömrəyə göndərəcəyik.`
      )
    } catch (e) {
      console.error('Failed to send confirmation WhatsApp:', e)
    }

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create access request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Bu əməliyyat üçün admin girişi tələb olunur' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID və status tələb olunur' }, { status: 400 })
    }

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update access request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
