import { NextResponse } from 'next/server'
import { processAiReceptionistMessage } from '@/app/actions/ai-receptionist'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { prisma } from '@/lib/prisma'

/**
 * WhatsApp Webhook API Route
 * Gələn WhatsApp mesajlarını qəbul edir, AI ilə təhlil edib bazaya (PENDING) işləyir
 * və müştəriyə avtomatik cavab mesajı göndərir.
 */

// GET endpoint (Webhook doğrulama və test üçün)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === 'vet_klinika_secret') {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({
    status: 'online',
    message: 'Vet Klinika WhatsApp Webhook Servisi Aktivdir'
  })
}

// POST endpoint (Real WhatsApp mesajlarını qəbul edir)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Standartlaşdırılmış mesaj çıxarışı (Meta, GreenAPI, UltraMsg və ya Custom Gateway üçün)
    let phone = '+994501234567'
    let whatsappJid = undefined
    let text = ''

    let audioUrl = null
    let isAudio = false

    if (body.message && body.phone) {
      // Custom / Baileys Gateway formatı
      phone = body.phone
      whatsappJid = body.whatsappJid
      text = body.message
      audioUrl = body.audioUrl || null
      isAudio = body.isAudio || false
    } else if (body.entry && body.entry[0]?.changes[0]?.value?.messages[0]) {
      // Meta WhatsApp Cloud API formatı
      const msg = body.entry[0].changes[0].value.messages[0]
      phone = msg.from.startsWith('+') ? msg.from : `+${msg.from}`
      text = msg.text?.body || ''
    } else if (body.bodyData && body.sender) {
      // Green API formatı
      phone = body.sender.replace('@c.us', '')
      phone = phone.startsWith('+') ? phone : `+${phone}`
      text = body.bodyData.textMessage || body.bodyData.extendedTextMessage?.text || ''
    } else if (body.data?.message) {
      // Alternativ format
      phone = body.data.phone || phone
      text = body.data.message
    }

    if (!text) {
      return NextResponse.json({ success: false, error: 'Mesaj mətni tapılmadı' }, { status: 400 })
    }

    // 2. AI Resepşn Mühərrikini Çalışdır (Pasiyent yaradılır, Randevu PENDING olunur, Mesaj yadda saxlanılır)
    const result = await processAiReceptionistMessage({ text, phone, whatsappJid, audioUrl, isAudio })

    if (!result.success || !result.appointment) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    const app = result.appointment
    const petName = app.patient.name
    const species = app.patient.species

    // 3. Müştəriyə Avtomatik Təbii WhatsApp Cavab Mətni Hazırla
    const replyMessage = `🐾 *VetKlinika AI Destək* 🐾\n\n` +
      `Salam! Müraciətiniz qeydə alındı.\n` +
      `📌 *Xəstə:* ${petName} (${species})\n` +
      `📌 *Müraciət Növü:* ${app.reason}\n\n` +
      `Həkimlərimiz müraciətinizi yoxlayıb təsdiqlədikdən sonra sizə ikinci dəqiqləşdirmə mesajı göndəriləcək. Təşəkkür edirik! 🙏`

    // 4. Avtomatik WhatsApp Yanıtı Göndər və Baza'ya yaz (processAiReceptionistMessage daxilində ola bilər və ya ayrıca yazmaq olar, lakin replyMessage zatən bəllidir)
    await sendWhatsAppMessage(phone, replyMessage)

    const owner = await prisma.owner.findUnique({ where: { phone } })
    if (owner) {
      await prisma.message.create({
        data: {
          text: replyMessage,
          isFromClinic: true,
          ownerId: owner.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      appointmentId: app.id,
      replyMessage,
      phone
    })
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
