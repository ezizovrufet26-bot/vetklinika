'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { runReceptionistBrain, type IntakeResult } from '@/lib/ai-brain'

// ── Regex fallback (Gemini xətasında) — əvvəlki sadə açar-söz sistemi ──
function regexFallbackIntake(text: string): IntakeResult {
  const cleanText = text.toLowerCase()
  let species = 'İt'
  if (/pişik|pisik|pişiy|cat/.test(cleanText)) species = 'Pişik'
  else if (/quş|qush|bird/.test(cleanText)) species = 'Quş'

  let petName: string | null = null
  if (cleanText.includes('besti')) petName = 'Besti'
  else if (cleanText.includes('diplo')) petName = 'Diplo'
  else if (/ ilə | ile /.test(cleanText)) {
    const parts = cleanText.split(/ ilə | ile /)
    if (parts[0]) {
      const words = parts[0].trim().split(' ')
      const w = words[words.length - 1]
      petName = w.charAt(0).toUpperCase() + w.slice(1)
    }
  }

  let reason = 'Müayinə və Baxış'
  if (/peyvənd|vaksen|vaksina/.test(cleanText)) reason = 'Peyvənd olunması'
  else if (/qan|analiz/.test(cleanText)) reason = 'Qan Analizi'
  else if (/əməliyyat|əməliyat|sterilizasiya/.test(cleanText)) reason = 'Cərrahi Əməliyyat'
  else if (/təmizlənmə|diş/.test(cleanText)) reason = 'Diş təmizlənməsi'

  const appDate = new Date()
  appDate.setDate(appDate.getDate() + 1)
  appDate.setHours(/onda|10/.test(cleanText) ? 10 : 15, 0, 0, 0)

  const urgent = /zəhər|qanax|huş|nəfəs|qıcolma|təcili/.test(cleanText)

  let action: IntakeResult['action'] = urgent ? 'urgent_escalation' : 'create_appointment'
  if (!urgent) {
    if (/peyvənd|vaksen|vaksina/.test(cleanText) && /nə vaxt|nə zaman|olubmu|görülübmü/.test(cleanText)) {
      action = 'vaccine_inquiry'
    } else if (/borc|faktura|qəbz|ödəni/.test(cleanText)) {
      action = 'invoice_inquiry'
    } else if (/həkim (nə dedi|qeyd)|müayinə(də|nin) nəticə|son ziyarət/.test(cleanText)) {
      action = 'visit_summary_inquiry'
    } else if (/randevu(m)?.*(təsdiq|status|nə vaxt|saat)/.test(cleanText)) {
      action = 'appointment_status_inquiry'
    }
  }

  return {
    action,
    species, petName, reason,
    dateTimeIso: appDate.toISOString(),
    ownerName: null,
    confidence: 3
  }
}

export interface ReceptionistResult {
  success: boolean
  replyMessage?: string
  appointmentId?: string
  urgent?: boolean
  error?: string
}

export async function processAiReceptionistMessage(input: {
  text: string
  phone?: string
  whatsappJid?: string
  audioUrl?: string | null
  isAudio?: boolean
}): Promise<ReceptionistResult> {
  try {
    const { text, phone = '+994501234567', whatsappJid, isAudio = false } = input

    // 1. Sahib tap/yarat
    let owner = await prisma.owner.findUnique({ where: { phone } })
    if (!owner) {
      owner = await prisma.owner.create({
        data: { firstName: 'WhatsApp Müştərisi', phone, whatsappJid: whatsappJid || null }
      })
    } else if (whatsappJid && owner.whatsappJid !== whatsappJid) {
      owner = await prisma.owner.update({ where: { id: owner.id }, data: { whatsappJid } })
    }

    // 2. Gələn mesajı yadda saxla
    await prisma.message.create({
      data: { text, audioUrl: input.audioUrl || null, isAudio, isFromClinic: false, ownerId: owner.id }
    })

    // 3. Söhbət tarixçəsi (son 6 mesaj, köhnədən yeniyə)
    const recent = await prisma.message.findMany({
      where: { ownerId: owner.id }, orderBy: { createdAt: 'desc' }, take: 6
    })
    const history = recent.reverse().slice(0, -1).map((m: typeof recent[number]) => ({
      role: (m.isFromClinic ? 'assistant' : 'user') as 'assistant' | 'user',
      text: m.text || ''
    }))

    // 4. Beyin: Gemini (2 çağırış) → uğursuzsa regex fallback
    const brainResult = await runReceptionistBrain({ userText: text, isAudio, history })
    const source = brainResult ? 'gemini' : 'regex_fallback'
    const intake = brainResult?.intake ?? regexFallbackIntake(text)
    let replyMessage = brainResult?.reply ?? null

    // 5. Aksiyona görə davran
    let appointmentId: string | undefined
    const urgent = intake.action === 'urgent_escalation'

    if (intake.action === 'create_appointment' || urgent) {
      const species = intake.species || 'İt'
      const petName = intake.petName || `${species} (Dostum)`
      const reason = intake.reason || 'Müayinə və Baxış'
      const date = intake.dateTimeIso ? new Date(intake.dateTimeIso) : (() => {
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(15, 0, 0, 0); return d
      })()

      let patient = await prisma.patient.findFirst({ where: { ownerId: owner.id, species } })
      if (!patient) {
        patient = await prisma.patient.create({ data: { name: petName, species, ownerId: owner.id } })
      } else if (intake.petName) {
        patient = await prisma.patient.update({ where: { id: patient.id }, data: { name: petName, species } })
      }

      // Sahibin artıq gözləyən/təsdiqlənmiş randevusu varsa, TƏKRAR yaratmaq əvəzinə
      // vaxtını yeniləyirik (yenidən planlaşdırma) — klinika yeni vaxtı təsdiqləməlidir.
      const existingAppointment = !urgent ? await prisma.appointment.findFirst({
        where: { patientId: patient.id, status: { in: ['PENDING', 'APPROVED'] }, date: { gt: new Date() } },
        orderBy: { date: 'desc' },
      }) : null

      const appointment = existingAppointment
        ? await prisma.appointment.update({
            where: { id: existingAppointment.id },
            data: { date, status: 'PENDING', reason: `${reason} (AI: yenidən planlaşdırıldı)` },
            include: { patient: { include: { owner: true } } },
          })
        : await prisma.appointment.create({
            data: {
              patientId: patient.id,
              date,
              reason: urgent ? `🚨 TƏCİLİ: ${reason} (AI: "${text.slice(0, 35)}...")` : `${reason} (AI: "${text.slice(0, 35)}...")`,
              status: 'PENDING',
              isAiGenerated: true,
              sourcePhone: phone
            },
            include: { patient: { include: { owner: true } } }
          })
      appointmentId = appointment.id

      // Rescheduling always gets its own precise message — Gemini's natural reply doesn't
      // know yet whether this was a new booking or a time change on an existing one.
      if (!replyMessage || existingAppointment) {
        const formattedDate = date.toLocaleString('az-AZ', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
        replyMessage = urgent
          ? `🚨 Bu TƏCİLİ hal ola bilər! Zəhmət olmasa dərhal klinikamıza gəlin, həkimlərimiz hazır olacaq.`
          : existingAppointment
            ? `Randevunuzun vaxtı yeniləndi!\n📌 Xəstə: ${petName} (${species})\n🕒 Yeni vaxt: ${formattedDate}\n\nHəkimlərimiz yeni vaxtı təsdiqlədikdən sonra sizə mesaj gələcək.`
            : `Salam! Müraciətiniz qeydə alındı.\n📌 Xəstə: ${petName} (${species})\n📌 Müraciət: ${reason}\n\nHəkimlərimiz təsdiqlədikdən sonra sizə mesaj gələcək. Təşəkkür edirik!`
      }
    }

    if (intake.action === 'vaccine_inquiry') {
      const patients = await prisma.patient.findMany({
        where: { ownerId: owner.id },
        include: { vaccines: { orderBy: { nextDueDate: 'asc' } } },
      })
      const lines = patients.flatMap(p =>
        p.vaccines.map(v => {
          const due = new Date(v.nextDueDate)
          const status = due < new Date() ? '⚠️ Gecikib' : '📅'
          return `${status} ${p.name}: ${v.name} — növbəti tarix ${due.toLocaleDateString('az-AZ')}`
        })
      )
      replyMessage = lines.length
        ? `Peyvənd cədvəliniz:\n${lines.join('\n')}`
        : 'Sistemdə hələ heyvanınız üçün qeydə alınmış peyvənd tarixçəsi yoxdur.'
    }

    if (intake.action === 'invoice_inquiry') {
      const patients = await prisma.patient.findMany({
        where: { ownerId: owner.id },
        include: { invoices: { where: { status: { in: ['UNPAID', 'PARTIAL'] } } } },
      })
      const unpaid = patients.flatMap(p => p.invoices.map(inv => ({ patient: p.name, inv })))
      const total = unpaid.reduce((sum, { inv }) => sum + inv.totalAmount, 0)
      replyMessage = unpaid.length
        ? `Ödənilməmiş fakturalarınız:\n${unpaid.map(({ patient, inv }) => `🧾 ${inv.invoiceNo} (${patient}): ${inv.totalAmount.toFixed(2)}₼`).join('\n')}\n\nÜmumi borc: ${total.toFixed(2)}₼`
        : 'Sistemdə ödənilməmiş faktura görünmür. Təşəkkür edirik!'
    }

    if (intake.action === 'visit_summary_inquiry') {
      const patients = await prisma.patient.findMany({
        where: { ownerId: owner.id },
        include: { visits: { orderBy: { visitDate: 'desc' }, take: 1 } },
      })
      const lines = patients.filter(p => p.visits.length).map(p => {
        const v = p.visits[0]
        return `🐾 ${p.name} (${v.visitDate.toLocaleDateString('az-AZ')}): ${v.doctorNotes || v.reason}`
      })
      replyMessage = lines.length
        ? `Son müayinə qeydləri:\n${lines.join('\n')}`
        : 'Sistemdə hələ heyvanınız üçün keçmiş müayinə qeydi yoxdur.'
    }

    if (intake.action === 'appointment_status_inquiry') {
      const upcoming = await prisma.appointment.findMany({
        where: { patient: { ownerId: owner.id }, date: { gt: new Date() } },
        include: { patient: true },
        orderBy: { date: 'asc' },
        take: 3,
      })
      const statusLabel = { PENDING: '⏳ Təsdiq gözləyir', APPROVED: '✅ Təsdiqlənib', REJECTED: '❌ Rədd edilib', COMPLETED: '✔️ Tamamlanıb' }
      replyMessage = upcoming.length
        ? `Randevularınız:\n${upcoming.map(a => `${statusLabel[a.status]} — ${a.patient.name}, ${new Date(a.date).toLocaleString('az-AZ', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}`).join('\n')}`
        : 'Hazırda gözləyən və ya təsdiqlənmiş randevunuz görünmür.'
    }

    if (!replyMessage) {
      replyMessage = intake.action === 'general_answer'
        ? 'Salam! Sualınızı qeyd etdim, klinikamızın işçisi tezliklə sizinlə əlaqə saxlayacaq.'
        : 'Salam! Zəhmət olmasa heyvanınızın növünü və gəliş səbəbini bildirin ki, sizə kömək edə bilim.'
    }

    // 6. Klinikanın cavabını da yadda saxla
    await prisma.message.create({
      data: { text: replyMessage, isFromClinic: true, ownerId: owner.id }
    })

    revalidatePath('/')
    revalidatePath('/calendar')

    console.log(`[ai-receptionist] source=${source} action=${intake.action} confidence=${intake.confidence}`)

    return { success: true, replyMessage, appointmentId, urgent }
  } catch (error: any) {
    console.error('AI Processing Error:', error)
    return { success: false, error: error.message || 'Xəta baş verdi' }
  }
}

export async function getPendingAiAppointments() {
  return await prisma.appointment.findMany({
    where: { status: 'PENDING' },
    include: {
      patient: {
        include: {
          owner: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } },
          visits: { orderBy: { visitDate: 'desc' }, take: 3 },
          vaccines: { orderBy: { dateGiven: 'desc' }, take: 3 }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}
