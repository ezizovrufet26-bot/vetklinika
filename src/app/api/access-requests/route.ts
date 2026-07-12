import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { normalizeIdentifier } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.APP_URL || 'https://vetklinika-aqkn.vercel.app'

/** GET/PATCH yalnız SUPERADMIN/ADMIN üçün; POST landing formasından ictimaidir */
async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
    return null
  }
  return session
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
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
    const { doctorName, clinicName, phone, email } = body

    if (!doctorName || !clinicName || !phone) {
      return NextResponse.json({ error: 'Ad, klinika və telefon xanalarını doldurun' }, { status: 400 })
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Email düzgün formatda deyil' }, { status: 400 })
    }

    const newRequest = await prisma.accessRequest.create({
      data: {
        doctorName: doctorName.trim(),
        clinicName: clinicName.trim(),
        phone: phone.trim(),
        email: cleanEmail || null,
        status: 'PENDING'
      }
    })

    // Müraciətin qeydə alındığını dərhal təsdiqlə (best-effort — uğursuzluq müraciəti pozmasın)
    const confirmText = `Salam ${newRequest.doctorName}! "${newRequest.clinicName}" üçün müraciətiniz qəbul edildi. Adminlərimiz qısa zamanda yoxlayıb təsdiqləyəcək — təsdiqləndikdən sonra şifrənizi təyin etmək üçün təlimat göndərəcəyik.`
    try {
      await sendWhatsAppMessage(newRequest.phone, `🐾 *VetKlinika*\n\n${confirmText}`)
    } catch (e) {
      console.error('Failed to send confirmation WhatsApp:', e)
    }
    if (newRequest.email) {
      try {
        await sendEmail(newRequest.email, 'VetKlinika — müraciətiniz qəbul edildi', `<p>${confirmText}</p>`)
      } catch (e) {
        console.error('Failed to send confirmation email:', e)
      }
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

    const existing = await prisma.accessRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Müraciət tapılmadı' }, { status: 404 })
    }

    // Təsdiqdən başqa status (məs. REJECTED) — sadəcə statusu yenilə
    if (status !== 'APPROVED') {
      const updated = await prisma.accessRequest.update({ where: { id }, data: { status } })
      return NextResponse.json(updated)
    }

    if (existing.status === 'APPROVED') {
      return NextResponse.json({ error: 'Bu müraciət artıq təsdiqlənib' }, { status: 409 })
    }

    // ── Təsdiq: klinika + ADMIN istifadəçi hesabı yarat ──────────────────
    const { phone } = normalizeIdentifier(existing.phone)
    if (!phone) {
      return NextResponse.json({ error: 'Telefon nömrəsi düzgün formatda deyil' }, { status: 400 })
    }
    const email = existing.email ? existing.email.trim().toLowerCase() : null

    // Nömrə və ya email artıq başqa istifadəçidədirsə, dublikat yaratma
    const clash = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    })
    if (clash) {
      return NextResponse.json(
        { error: 'Bu telefon və ya email artıq başqa bir istifadəçiyə bağlıdır' },
        { status: 409 }
      )
    }

    // Şifrəni MÜŞTƏRİ özü OTP ilə təyin edəcək. Hesab istifadə olunmayan
    // təsadüfi placeholder ilə yaradılır — heç kim təxmin edib girə bilməz,
    // müştəri /forgot-password axını ilə öz şifrəsini qurana qədər.
    const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)

    const clinic = await prisma.clinic.create({
      data: { name: existing.clinicName, publicPhone: phone },
    })

    const user = await prisma.user.create({
      data: {
        name: existing.doctorName,
        phone,
        email,
        passwordHash: placeholderHash,
        role: 'ADMIN',
        clinicId: clinic.id,
      },
    })

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    })

    // ── Müştəriyə "şifrənizi təyin edin" təlimatı (gizli məlumat YOXDUR) ──
    const setupUrl = `${APP_URL}/forgot-password`
    const instruct = `"${clinic.name}" VetKlinika sisteminə qoşuldu! Şifrənizi təyin etmək üçün:\n1. ${setupUrl} səhifəsinə keçin\n2. Nömrənizi yazın: ${phone}\n3. Gələn kodu daxil edib öz şifrənizi seçin\n4. ${APP_URL}/login ilə daxil olun`

    const wpResult = await sendWhatsAppMessage(phone, `🎉 *VetKlinika* — Təsdiqləndiniz!\n\n${instruct}`)

    let emailResult: { success: boolean; error?: string } = { success: false, error: 'Email verilməyib' }
    if (email) {
      emailResult = await sendEmail(
        email,
        '🎉 VetKlinika — hesabınız hazırdır, şifrənizi təyin edin',
        `<div style="font-family:sans-serif;max-width:480px">
          <h2>Xoş gəldiniz, ${user.name}!</h2>
          <p>"<strong>${clinic.name}</strong>" VetKlinika sisteminə qoşuldu. Öz şifrənizi təyin etmək üçün:</p>
          <ol style="line-height:1.8">
            <li><a href="${setupUrl}">${setupUrl}</a> səhifəsinə keçin</li>
            <li>Nömrənizi yazın: <strong>${phone}</strong> (və ya email: <strong>${email}</strong>)</li>
            <li>Gələn 6 rəqəmli kodu daxil edin</li>
            <li>Öz şifrənizi seçin və <a href="${APP_URL}/login">daxil olun</a></li>
          </ol>
          <p style="color:#666;font-size:13px">Bu təlimatı siz istəmisinizsə davam edin. Şübhəli görünürsə, nəzərə almayın.</p>
        </div>`
      )
    }

    return NextResponse.json({
      ...updated,
      userId: user.id,
      clinicId: clinic.id,
      setupUrl,
      whatsappSent: wpResult.success,
      whatsappError: wpResult.success ? undefined : wpResult.error,
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : emailResult.error,
    })
  } catch (error: any) {
    console.error('Failed to update access request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
