'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function getOmnichannelData() {
  const owners = await prisma.owner.findMany({
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      },
      patients: {
        include: {
          appointments: {
            orderBy: { date: 'desc' }
          },
          visits: {
            orderBy: { visitDate: 'desc' }
          },
          vaccines: {
            orderBy: { dateGiven: 'desc' }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  // Filter only owners who have messages
  return owners.filter(owner => owner.messages.length > 0)
}

export async function sendManualReply(ownerId: string, text: string) {
  const owner = await prisma.owner.findUnique({ where: { id: ownerId } })
  if (!owner) throw new Error('Owner not found')

  // 1. Bazaya əlavə et
  await prisma.message.create({
    data: {
      text,
      isFromClinic: true,
      ownerId
    }
  })

  // 2. WhatsApp-dan müştəriyə birbaşa mesaj göndər
  const recipientId = owner.whatsappJid || owner.phone
  await sendWhatsAppMessage(recipientId, text)

  revalidatePath('/dashboard/communications')
  return { success: true }
}
