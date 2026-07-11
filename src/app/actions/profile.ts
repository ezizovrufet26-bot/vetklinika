'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { uploadImageBuffer } from '@/lib/cloudinary'

async function uploadIfPresent(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined
  const buffer = Buffer.from(await file.arrayBuffer())
  return uploadImageBuffer(buffer, folder)
}

export async function updateUserProfile(_prev: any, formData: FormData) {
  const session = await getSession()
  if (!session?.sub) {
    return { error: 'Sessiya tapılmadı. Zəhmət olmasa yenidən daxil olun.' }
  }

  const name = String(formData.get('name') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const photo = formData.get('photo') as File | null

  if (!name) {
    return { error: 'Ad Soyad boş ola bilməz.' }
  }

  let photoUrl: string | undefined
  try {
    photoUrl = await uploadIfPresent(photo, 'vet-klinika/profiles')
  } catch (e) {
    console.error('Profil şəkli yüklənmə xətası:', e)
    return { error: 'Şəkil yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' }
  }

  await prisma.user.update({
    where: { id: session.sub },
    data: {
      name,
      title: title || null,
      ...(photoUrl ? { photoUrl } : {}),
    },
  })

  revalidatePath('/', 'layout')
  return { success: 'Profil uğurla yeniləndi!' }
}

export async function updateClinicProfile(_prev: any, formData: FormData) {
  const session = await getSession()
  if (!session?.sub) {
    return { error: 'Sessiya tapılmadı. Zəhmət olmasa yenidən daxil olun.' }
  }
  if (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN') {
    return { error: 'Klinika profilini dəyişmək üçün admin səlahiyyəti tələb olunur.' }
  }
  if (!session.clinicId) {
    return { error: 'Hesabınız heç bir klinikaya bağlı deyil.' }
  }

  const address = String(formData.get('address') || '').trim()
  const publicPhone = String(formData.get('publicPhone') || '').trim()
  const servicesRaw = String(formData.get('services') || '')
  const services = servicesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const latitude = formData.get('latitude') ? Number(formData.get('latitude')) : null
  const longitude = formData.get('longitude') ? Number(formData.get('longitude')) : null
  const logo = formData.get('logo') as File | null

  let logoUrl: string | undefined
  try {
    logoUrl = await uploadIfPresent(logo, 'vet-klinika/clinic-logos')
  } catch (e) {
    console.error('Klinika loqosu yüklənmə xətası:', e)
    return { error: 'Loqo yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' }
  }

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      address: address || null,
      publicPhone: publicPhone || null,
      services,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      ...(logoUrl ? { logoUrl } : {}),
    },
  })

  revalidatePath('/', 'layout')
  return { success: 'Klinika profili uğurla yeniləndi!' }
}

export async function getProfileData() {
  const session = await getSession()
  if (!session?.sub) return null

  // NOTE: explicit `select` — never pass passwordHash/otpCode to the client.
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, title: true, photoUrl: true },
  })
  const clinic = session.clinicId
    ? await prisma.clinic.findUnique({
        where: { id: session.clinicId },
        select: {
          id: true, name: true, logoUrl: true, address: true,
          latitude: true, longitude: true, publicPhone: true, services: true,
        },
      })
    : null

  return { user, clinic }
}
