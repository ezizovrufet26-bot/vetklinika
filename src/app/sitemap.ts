import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.APP_URL || 'https://vetklinika-aqkn.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let clinicEntries: MetadataRoute.Sitemap = []
  try {
    const clinics = await prisma.clinic.findMany({
      where: { isPublished: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    })
    clinicEntries = clinics.map(c => ({
      url: `${BASE_URL}/klinikalar/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB əlçatmazdırsa, statik səhifələr yenə də sitemap-a düşür
  }

  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/klinikalar`, changeFrequency: 'daily', priority: 0.9 },
    ...clinicEntries,
  ]
}
