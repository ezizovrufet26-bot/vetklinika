'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addDiagnosticImage(data: {
  patientId: string
  type: 'UZI' | 'XRAY' | 'CT' | 'MICROSCOPY'
  fileUrl: string
  notes?: string
  deviceName?: string
}) {
  await prisma.diagnosticImage.create({
    data: {
      patientId: data.patientId,
      type: data.type,
      fileUrl: data.fileUrl,
      notes: data.notes || 'Aparat tərəfindən avtomatik yükləndi',
      deviceName: data.deviceName || 'Mindray Vetus 8 / IDEXX DR30'
    }
  })
  revalidatePath(`/patients/${data.patientId}`)
}

export async function addLabResult(data: {
  patientId: string
  deviceName: string
  testType: 'HEMATOLOGY' | 'BIOCHEMISTRY'
  dataJson: string
}) {
  await prisma.labResult.create({
    data: {
      patientId: data.patientId,
      deviceName: data.deviceName,
      testType: data.testType,
      dataJson: data.dataJson
    }
  })
  revalidatePath(`/patients/${data.patientId}`)
}
