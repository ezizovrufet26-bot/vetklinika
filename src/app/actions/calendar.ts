'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function getAppointments() {
  return await prisma.appointment.findMany({
    include: {
      patient: true
    }
  })
}

export async function createAppointment(data: { patientId: string, date: Date, reason: string }) {
  await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      date: data.date,
      reason: data.reason,
      status: 'PENDING'
    }
  })
  revalidatePath('/calendar')
}

export async function updateAppointmentStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED') {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: { patient: { include: { owner: true } } }
  })

  // Əgər randevu təsdiqləndisə və ya ləğv edildisə, WhatsApp mesajı göndər və bazaya (Çat tarixcəsinə) yaz
  if ((status === 'APPROVED' || status === 'REJECTED') && appointment.patient.owner.phone) {
    const { patient, date } = appointment
    const formattedDate = new Date(date).toLocaleString('az-AZ', {
      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    })
    
    let message = ''
    if (status === 'APPROVED') {
      message = `Salam ${patient.owner.firstName}!\n\n🐾 ${patient.name} üçün randevunuz *təsdiqləndi*.\n📅 Vaxt: ${formattedDate}\n\nSizi VetKlinika-da gözləyirik! 🏥`
    } else if (status === 'REJECTED') {
      message = `Salam ${patient.owner.firstName}!\n\n🐾 ${patient.name} üçün randevu tələbiniz hazırda *qəbul edilə bilmədi* (Uyğun vaxt olmaması və ya digər səbəblərdən).\nZəhmət olmasa başqa vaxt üçün yenidən əlaqə saxlayın.`
    }
    
    // Use whatsappJid directly if available to ensure correct routing
    const recipientId = patient.owner.whatsappJid || patient.owner.phone
    await sendWhatsAppMessage(recipientId, message)

    await prisma.message.create({
      data: {
        text: message,
        isFromClinic: true,
        ownerId: patient.owner.id
      }
    })
  }

  revalidatePath('/dashboard/communications')
  revalidatePath('/dashboard/communications')
  revalidatePath('/calendar')
}

export async function rescheduleAppointment(id: string, newDate: Date) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { date: newDate },
    include: { patient: { include: { owner: true } } }
  })

  // If it's already approved, we should probably notify the owner about the change.
  if (appointment.status === 'APPROVED' && appointment.patient.owner.phone) {
    const { patient, date } = appointment
    const formattedDate = new Date(date).toLocaleString('az-AZ', {
      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    })
    const message = `Salam ${patient.owner.firstName}!\n\n🐾 ${patient.name} üçün randevu vaxtınız *dəyişdirildi*.\n📅 Yeni Vaxt: ${formattedDate}\n\nSizi VetKlinika-da gözləyirik! 🏥`
    
    const recipientId = patient.owner.whatsappJid || patient.owner.phone
    await sendWhatsAppMessage(recipientId, message)

    await prisma.message.create({
      data: {
        text: message,
        isFromClinic: true,
        ownerId: patient.owner.id
      }
    })
  }

  revalidatePath('/calendar')
}

export async function rescheduleAndApproveAppointment(id: string, newHour: number) {
  const existing = await prisma.appointment.findUnique({ where: { id } })
  if (!existing) return

  const newDate = new Date(existing.date)
  newDate.setHours(newHour, 0, 0, 0)

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      date: newDate,
      status: 'APPROVED'
    },
    include: { patient: { include: { owner: true } } }
  })

  if (appointment.patient.owner.phone) {
    const { patient } = appointment
    const formattedDate = new Date(newDate).toLocaleString('az-AZ', {
      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    })
    
    const message = `Salam ${patient.owner.firstName}!\n\n🐾 ${patient.name} üçün randevu vaxtınız həkim tərəfindən saat *${newHour}:00*-a dəyişdirildi və *təsdiqləndi*.\n📅 Yeni Vaxt: ${formattedDate}\n\nSizi VetKlinika-da gözləyirik! 🏥`
    
    const recipientId = patient.owner.whatsappJid || patient.owner.phone
    await sendWhatsAppMessage(recipientId, message)

    await prisma.message.create({
      data: {
        text: message,
        isFromClinic: true,
        ownerId: patient.owner.id
      }
    })
  }

  revalidatePath('/dashboard/communications')
  revalidatePath('/')
  revalidatePath('/calendar')
}
