'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePatientStatus(patientId: string, newStatus: string) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { clinicStatus: newStatus as any }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update Error:', error)
    return { success: false }
  }
}
