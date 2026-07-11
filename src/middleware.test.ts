import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

function requestFor(pathname: string, init?: { method?: string }) {
  return new NextRequest(new URL(pathname, 'https://vetklinika.example'), init)
}

describe('middleware public-path allowlist', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-key-for-vitest-only'
  })

  it('lets an unauthenticated visitor reach /forgot-password (regression pin)', async () => {
    const res = await middleware(requestFor('/forgot-password'))
    expect(res.status).not.toBe(307)
    expect(res.headers.get('location')).toBeNull()
  })

  it('lets an unauthenticated visitor reach / and /login', async () => {
    for (const path of ['/', '/login']) {
      const res = await middleware(requestFor(path))
      expect(res.headers.get('location')).toBeNull()
    }
  })

  it('redirects an unauthenticated visitor away from a protected page to /login', async () => {
    const res = await middleware(requestFor('/patients'))
    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/login')
    expect(location).toContain('next=%2Fpatients')
  })

  it('returns 401 JSON instead of a redirect for an unauthenticated protected API call', async () => {
    const res = await middleware(requestFor('/api/patients'))
    expect(res.status).toBe(401)
  })

  it('allows unauthenticated POST to /api/whatsapp/* (external webhook)', async () => {
    const res = await middleware(requestFor('/api/whatsapp/webhook', { method: 'POST' }))
    expect(res.status).not.toBe(401)
  })

  it('lets an unauthenticated visitor reach the public directory and clinic profiles', async () => {
    for (const path of ['/klinikalar', '/klinikalar/merkez-baytarliq-klinikasi']) {
      const res = await middleware(requestFor(path))
      expect(res.headers.get('location')).toBeNull()
    }
  })

  it('does NOT treat prefix-lookalike paths as public (/klinikalarfake)', async () => {
    const res = await middleware(requestFor('/klinikalarfake'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('lets crawlers reach sitemap.xml and robots.txt', async () => {
    for (const path of ['/sitemap.xml', '/robots.txt']) {
      const res = await middleware(requestFor(path))
      expect(res.headers.get('location')).toBeNull()
    }
  })
})
