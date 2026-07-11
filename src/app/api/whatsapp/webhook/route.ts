import { NextResponse } from 'next/server'
import { processAiReceptionistMessage } from '@/app/actions/ai-receptionist'

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

    // 2. AI Resepşn Mühərrikini Çalışdır (Gemini beyin → PENDING randevu / eskalasiya, mesajlar yadda saxlanılır)
    const result = await processAiReceptionistMessage({ text, phone, whatsappJid, audioUrl, isAudio })

    if (!result.success || !result.replyMessage) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // Qeyd: göndərişi gateway edir (isAudio-ya görə mətn/səs seçir) — burada göndərmirik.
    return NextResponse.json({
      success: true,
      appointmentId: result.appointmentId,
      urgent: result.urgent,
      replyMessage: result.replyMessage,
      phone
    })
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
