'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addVisit(patientId: string, formData: FormData) {
  const reason = formData.get('reason') as string
  const temperature = parseFloat(formData.get('temperature') as string)
  const weight = parseFloat(formData.get('weight') as string)
  const doctorNotes = formData.get('doctorNotes') as string
  const treatment = formData.get('treatment') as string

  await prisma.visit.create({
    data: {
      patientId,
      reason,
      temperature: isNaN(temperature) ? null : temperature,
      weight: isNaN(weight) ? null : weight,
      doctorNotes,
      treatment
    }
  })

  revalidatePath(`/patients/${patientId}`)
}
