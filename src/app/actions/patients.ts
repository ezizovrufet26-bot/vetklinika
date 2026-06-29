'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPatient(formData: FormData) {
  const ownerName = formData.get('ownerName') as string
  const ownerPhone = formData.get('ownerPhone') as string
  const patientName = formData.get('patientName') as string
  const species = formData.get('species') as string
  const breed = formData.get('breed') as string
  const chipNumber = formData.get('chipNumber') as string

  if (!ownerName || !ownerPhone || !patientName || !species) {
    return { success: false, error: 'Zəhmət olmasa ulduzlu (*) xanaları doldurun.' }
  }

  try {
    // 1. Mövcud sahibi axtar və ya yenisini yarat
    let owner = await prisma.owner.findUnique({
      where: { phone: ownerPhone }
    })

    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          firstName: ownerName,
          phone: ownerPhone,
        }
      })
    }

    // 2. Yeni Heyvanı (Xəstəni) bazaya yaz
    const patient = await prisma.patient.create({
      data: {
        name: patientName,
        species: species,
        breed: breed || null,
        chipNumber: chipNumber || null,
        ownerId: owner.id,
        clinicStatus: 'WAITING'
      }
    })

    // Uğurlu olarsa ön səhifəni yenilə
    revalidatePath('/')
    
    return { success: true, message: 'Xəstə uğurla bazaya əlavə edildi!' }
    
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'P2002') {
      return { success: false, error: 'Bu Çip nömrəsi və ya Telefon artıq başqa qeydiyyatda istifadə olunub.' }
    }
    return { success: false, error: 'Gözlənilməz xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.' }
  }
}
