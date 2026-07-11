'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { uploadImageBuffer } from '@/lib/cloudinary'
import { slugify, normalizeWhatsAppNumber, parseWorkingHours } from '@/lib/directory'

/**
 * Tərəfdaş klinikaların (ictimai kataloq) idarəsi — yalnız SUPERADMIN.
 * ADMIN öz klinikasını Ayarlar-dan idarə edir; kataloq kurasiyası tək əldədir.
 */

const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2MB

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session?.sub || session.role !== 'SUPERADMIN') return null
  return session
}

/** Server-side foto validasiyası + Cloudinary yükləməsi. Boş fayl → undefined. */
async function uploadValidatedPhoto(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Şəkil 2MB-dan böyük ola bilməz.')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Yalnız şəkil faylları qəbul olunur.')
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  return uploadImageBuffer(buffer, folder)
}

/** Unikal slug: ad → slug; toqquşanda -2, -3... artırılır. */
async function uniqueSlug(name: string, excludeClinicId?: string): Promise<string> {
  const base = slugify(name) || 'klinika'
  let candidate = base
  for (let i = 2; i < 50; i++) {
    const existing = await prisma.clinic.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeClinicId) return candidate
    candidate = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

export async function getPartners() {
  const session = await requireSuperAdmin()
  if (!session) return { error: 'Bu əməliyyat üçün SUPERADMIN səlahiyyəti tələb olunur.' }

  const clinics = await prisma.clinic.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      doctors: { orderBy: { displayOrder: 'asc' } },
      _count: { select: { users: true } },
    },
  })
  return { clinics }
}

export async function savePartner(_prev: any, formData: FormData) {
  const session = await requireSuperAdmin()
  if (!session) return { error: 'Bu əməliyyat üçün SUPERADMIN səlahiyyəti tələb olunur.' }

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  if (!name) return { error: 'Klinika adı boş ola bilməz.' }

  const city = String(formData.get('city') || '').trim() || null
  const district = String(formData.get('district') || '').trim() || null
  const address = String(formData.get('address') || '').trim() || null
  const description = String(formData.get('description') || '').trim() || null
  const publicPhone = String(formData.get('publicPhone') || '').trim() || null
  const whatsappRaw = String(formData.get('whatsappNumber') || '').trim()
  const whatsappNumber = normalizeWhatsAppNumber(whatsappRaw)
  if (whatsappRaw && !whatsappNumber) {
    return { error: 'WhatsApp nömrəsi düzgün formatda deyil (məs: +994501234567).' }
  }
  const googlePlaceUrl = String(formData.get('googlePlaceUrl') || '').trim() || null
  if (googlePlaceUrl && !/^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(googlePlaceUrl)) {
    return { error: 'Google Maps linki düzgün deyil.' }
  }
  const services = String(formData.get('services') || '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const latitude = formData.get('latitude') ? Number(formData.get('latitude')) : null
  const longitude = formData.get('longitude') ? Number(formData.get('longitude')) : null
  const emergencyAvailable = formData.get('emergencyAvailable') === 'on'
  const isVetKlinikaTenant = formData.get('isVetKlinikaTenant') === 'on'
  const displayOrder = Number(formData.get('displayOrder') || 0) || 0

  // İş saatları: gizli input-da JSON string gəlir, parseWorkingHours zibili süzür
  let workingHours: ReturnType<typeof parseWorkingHours> | undefined
  const whRaw = String(formData.get('workingHours') || '')
  if (whRaw) {
    try { workingHours = parseWorkingHours(JSON.parse(whRaw)) } catch { workingHours = undefined }
  }

  let logoUrl: string | undefined
  let coverPhotoUrl: string | undefined
  try {
    logoUrl = await uploadValidatedPhoto(formData.get('logo') as File | null, 'vet-klinika/clinic-logos')
    coverPhotoUrl = await uploadValidatedPhoto(formData.get('cover') as File | null, 'vet-klinika/clinic-covers')
  } catch (e: any) {
    return { error: e.message || 'Şəkil yüklənərkən xəta baş verdi.' }
  }

  const data = {
    name,
    city, district, address, description, publicPhone, whatsappNumber,
    googlePlaceUrl, services, emergencyAvailable, isVetKlinikaTenant, displayOrder,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    ...(workingHours !== undefined ? { workingHours } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(coverPhotoUrl ? { coverPhotoUrl } : {}),
  }

  let clinicId: string
  if (id) {
    const existing = await prisma.clinic.findUnique({ where: { id } })
    if (!existing) return { error: 'Klinika tapılmadı.' }
    const slug = existing.slug || (await uniqueSlug(name, id))
    await prisma.clinic.update({ where: { id }, data: { ...data, slug } })
    clinicId = id
  } else {
    const slug = await uniqueSlug(name)
    const created = await prisma.clinic.create({ data: { ...data, slug } })
    clinicId = created.id
  }

  revalidatePath('/klinikalar')
  revalidatePath('/dashboard/partners')
  return { success: 'Klinika yadda saxlanıldı.', clinicId }
}

export async function togglePartnerPublished(id: string) {
  const session = await requireSuperAdmin()
  if (!session) return { error: 'Bu əməliyyat üçün SUPERADMIN səlahiyyəti tələb olunur.' }

  const clinic = await prisma.clinic.findUnique({ where: { id } })
  if (!clinic) return { error: 'Klinika tapılmadı.' }
  if (!clinic.isPublished && !clinic.slug) {
    return { error: 'Dərc etməzdən əvvəl klinikanı bir dəfə yadda saxlayın (slug yaranmalıdır).' }
  }

  await prisma.clinic.update({ where: { id }, data: { isPublished: !clinic.isPublished } })
  revalidatePath('/klinikalar')
  revalidatePath('/dashboard/partners')
  return { success: clinic.isPublished ? 'Kataloqdan gizlədildi.' : 'Kataloqda dərc olundu.' }
}

export async function deletePartner(id: string) {
  const session = await requireSuperAdmin()
  if (!session) return { error: 'Bu əməliyyat üçün SUPERADMIN səlahiyyəti tələb olunur.' }

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!clinic) return { error: 'Klinika tapılmadı.' }
  // PIMS istifadəçiləri olan klinika kataloq CRUD-undan silinə bilməz —
  // real hesablar/sessiyalar ona bağlıdır.
  if (clinic._count.users > 0) {
    return { error: 'Bu klinikada real istifadəçi hesabları var — silinə bilməz, yalnız gizlədilə bilər.' }
  }

  await prisma.clinic.delete({ where: { id } })
  revalidatePath('/klinikalar')
  revalidatePath('/dashboard/partners')
  return { success: 'Klinika silindi.' }
}

// ── Həkim heyəti (ClinicDoctor) ─────────────────────────────────────────

export async function saveDoctor(_prev: any, formData: FormData) {
  const session = await requireSuperAdmin()
  if (!session) return { error: 'Bu əməliyyat üçün SUPERADMIN səlahiyyəti tələb olunur.' }

  const id = String(formData.get('id') || '')
  const clinicId = String(formData.get('clinicId') || '')
  const name = String(formData.get('name') || '').trim()
  if (!clinicId || !name) return { error: 'Klinika və həkim adı mütləqdir.' }

  const title = String(formData.get('title') || '').trim() || null
  const bio = String(formData.get('bio') || '').trim() || null
  const specialties = String(formData.get('specialties') || '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const displayOrder = Number(formData.get('displayOrder') || 0) || 0

  let photoUrl: string | undefined
  try {
    photoUrl = await uploadValidatedPhoto(formData.get('photo') as File | null, 'vet-klinika/doctors')
  } catch (e: any) {
    return { error: e.message || 'Şəkil yüklənərkən xəta baş verdi.' }
  }

  const data = { name, title, bio, specialties, displayOrder, ...(photoUrl ? { photoUrl } : {}) }

  if (id) {
    await prisma.clinicDoctor.update({ where: { id }, data })
  } else {
    await prisma.clinicDoctor.create({ data: { ...data, clinicId } })
  }

  revalidatePath('/klinikalar')
  revalidatePath('/dashboard/partners')
  return { success: 'Həkim yadda saxlanıldı.' }
}

export async function deleteDoctor(id: string) {
  const session = await requireSuperAdmin()
  if (!session) return { error: 'Bu əməliyyat üçün SUPERADMIN səlahiyyəti tələb olunur.' }

  await prisma.clinicDoctor.delete({ where: { id } })
  revalidatePath('/klinikalar')
  revalidatePath('/dashboard/partners')
  return { success: 'Həkim silindi.' }
}
