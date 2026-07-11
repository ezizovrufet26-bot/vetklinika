'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { draftSoapNote } from '@/lib/ai-brain'

export async function generateSoapDraft(input: {
  species: string
  patientName: string
  reason: string
  temperature: number | null
  weight: number | null
}) {
  if (!input.reason?.trim()) {
    return { error: 'Qaralama üçün əvvəlcə ziyarət səbəbini yazın.' }
  }
  const draft = await draftSoapNote(input)
  if (!draft) {
    return { error: 'AI qaralama hazırlaya bilmədi. Qeydi əl ilə yazın.' }
  }
  return { draft }
}

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
