import type { MetadataRoute } from 'next'

const BASE_URL = process.env.APP_URL || 'https://vetklinika-aqkn.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/klinikalar'],
        // Daxili sistem səhifələri axtarışa düşməsin
        disallow: ['/dashboard', '/patients', '/calendar', '/invoices', '/inventory', '/laboratory', '/analytics', '/api'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
