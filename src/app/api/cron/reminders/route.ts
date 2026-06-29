import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// Bu API endpoint-i Vercel Cron və ya hər hansı bir CRON server tərəfindən hər gün səhər 09:00-da çağırılacaq
export async function GET() {
  try {
    const today = new Date()
    // 3 gün sonrakı tarixi tapırıq
    const targetDate = new Date()
    targetDate.setDate(today.getDate() + 3)

    // Start of the day and end of the day for targetDate
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    // 3 gün sonra peyvəndi olan xəstələri tap
    const vaccines = await prisma.vaccine.findMany({
      where: {
        nextDueDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        isReminderSent: false
      },
      include: {
        patient: {
          include: {
            owner: true
          }
        }
      }
    })

    const sentCount = vaccines.length

    // Hər birinə mesaj göndər
    for (const vaccine of vaccines) {
      const { patient, name: vaccineName } = vaccine
      const phone = patient.owner.phone
      const recipientId = patient.owner.whatsappJid || phone

      if (recipientId) {
        const message = `Salam ${patient.owner.firstName}!\n\n💉 Xatırlatma: 🐾 ${patient.name} adlı dostumuzun *${vaccineName}* peyvəndinə cəmi 3 gün qalıb.\n\nZəhmət olmasa yaxın günlərdə klinikamıza yaxınlaşın və ya randevu alın. 🏥`
        
        await sendWhatsAppMessage(recipientId, message)

        // Mesajın getdiyini qeyd et ki, sabah yenə göndərməsin
        await prisma.vaccine.update({
          where: { id: vaccine.id },
          data: { isReminderSent: true }
        })
      }
    }

    return NextResponse.json({ success: true, message: `${sentCount} peyvənd xatırlatması göndərildi.` })
  } catch (error) {
    console.error('CRON Error:', error)
    return NextResponse.json({ success: false, error: 'Xəta baş verdi' }, { status: 500 })
  }
}
