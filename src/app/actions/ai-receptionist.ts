'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function processAiReceptionistMessage(input: { text: string; phone?: string; whatsappJid?: string; audioUrl?: string | null; isAudio?: boolean }) {
  try {
    const { text, phone = '+994501234567', whatsappJid } = input
    const cleanText = text.toLowerCase()

    // 1. Smart Species Detection
    let species = 'İt'
    if (cleanText.includes('pişik') || cleanText.includes('pisik') || cleanText.includes('pişiy') || cleanText.includes('cat')) {
      species = 'Pişik'
    } else if (cleanText.includes('quş') || cleanText.includes('qush') || cleanText.includes('bird')) {
      species = 'Quş'
    } else if (cleanText.includes('it') || cleanText.includes('köpək') || cleanText.includes('kopek') || cleanText.includes('dog')) {
      species = 'İt'
    }

    // 2. Smart Pet Name Detection (e.g., "bestiitimlə", "diplo ilə", "mən besti")
    let petName = 'Dostum'
    if (cleanText.includes('besti')) {
      petName = 'Besti'
    } else if (cleanText.includes('diplo')) {
      petName = 'Diplo'
    } else if (cleanText.includes(' ilə ') || cleanText.includes(' ile ')) {
      const parts = cleanText.split(/ ilə | ile /)
      if (parts[0]) {
        const words = parts[0].trim().split(' ')
        petName = words[words.length - 1]
        petName = petName.charAt(0).toUpperCase() + petName.slice(1)
      }
    }

    // 3. Extract Reason
    let reason = 'Müayinə və Baxış'
    if (cleanText.includes('peyvənd') || cleanText.includes('vaksen') || cleanText.includes('vaksina')) {
      reason = 'Peyvənd olunması'
    } else if (cleanText.includes('qan') || cleanText.includes('analiz')) {
      reason = 'Qan Analizi'
    } else if (cleanText.includes('əməliyyat') || cleanText.includes('əməliyat') || cleanText.includes('sterilizasiya')) {
      reason = 'Cərrahi Əməliyyat'
    } else if (cleanText.includes('təmizlənmə') || cleanText.includes('diş')) {
      reason = 'Diş təmizlənməsi'
    }

    // Determine appointment date (tomorrow 10:00 or 15:00 based on text)
    const appDate = new Date()
    appDate.setDate(appDate.getDate() + 1)
    if (cleanText.includes('onda') || cleanText.includes('10')) {
      appDate.setHours(10, 0, 0, 0)
    } else {
      appDate.setHours(15, 0, 0, 0)
    }

    // 4. Find or Create Owner & Patient
    let owner = await prisma.owner.findUnique({
      where: { phone }
    })

    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          firstName: 'WhatsApp Müştərisi',
          phone,
          whatsappJid: whatsappJid || null
        }
      })
    } else if (whatsappJid && owner.whatsappJid !== whatsappJid) {
      owner = await prisma.owner.update({
        where: { id: owner.id },
        data: { whatsappJid }
      })
    }

    // Səsli və ya yazılı gələn mesajı bazaya yaz
    await prisma.message.create({
      data: {
        text,
        audioUrl: input.audioUrl || null,
        isAudio: input.isAudio || false,
        isFromClinic: false,
        ownerId: owner.id
      }
    })

    // Find patient with matching species or create new
    let patient = await prisma.patient.findFirst({
      where: { ownerId: owner.id, species }
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: petName !== 'Dostum' ? petName : `${species} (Dostum)`,
          species,
          ownerId: owner.id
        }
      })
    } else {
      // Update patient name and species if specific
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          name: petName !== 'Dostum' ? petName : patient.name,
          species
        }
      })
    }

    // 5. Create PENDING Appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        date: appDate,
        reason: `${reason} (AI Zəng: "${text.slice(0, 35)}...")`,
        status: 'PENDING',
        isAiGenerated: true,
        sourcePhone: phone
      },
      include: {
        patient: {
          include: {
            owner: true
          }
        }
      }
    })

    revalidatePath('/')
    revalidatePath('/calendar')

    return { success: true, appointment }
  } catch (error: any) {
    console.error('AI Processing Error:', error)
    return {
      success: false,
      error: error.message || 'Xəta baş verdi'
    }
  }
}

export async function getPendingAiAppointments() {
  return await prisma.appointment.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      patient: {
        include: {
          owner: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          },
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 3
          },
          vaccines: {
            orderBy: { dateGiven: 'desc' },
            take: 3
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}
