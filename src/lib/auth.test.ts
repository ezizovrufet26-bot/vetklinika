import { describe, it, expect, beforeEach } from 'vitest'
import { createSessionToken, verifySessionToken, normalizeIdentifier, getSecretKey } from './auth'

describe('normalizeIdentifier', () => {
  it('treats anything with @ as an email, lowercased', () => {
    expect(normalizeIdentifier('User@Example.COM')).toEqual({ email: 'user@example.com' })
  })

  it('normalizes a 9-digit local phone to +994 form', () => {
    expect(normalizeIdentifier('513779099')).toEqual({ phone: '+994513779099' })
  })

  it('strips a leading 0 before adding the +994 prefix', () => {
    expect(normalizeIdentifier('0513779099')).toEqual({ phone: '+994513779099' })
  })

  it('leaves an already-prefixed international number as-is (just re-adds +)', () => {
    expect(normalizeIdentifier('+994513779099')).toEqual({ phone: '+994513779099' })
  })
})

describe('createSessionToken / verifySessionToken round-trip', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-key-for-vitest-only'
  })

  it('signs a payload and verifies it back to the same shape', async () => {
    const payload = { sub: 'user-1', name: 'Test Doctor', role: 'ADMIN' as const, clinicId: 'clinic-1' }
    const token = await createSessionToken(payload)
    const verified = await verifySessionToken(token)
    expect(verified).toMatchObject(payload)
  })

  it('rejects a garbage token', async () => {
    const verified = await verifySessionToken('not-a-real-jwt')
    expect(verified).toBeNull()
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken({ sub: 'user-1', name: 'X', role: 'STAFF' })
    process.env.AUTH_SECRET = 'a-different-secret'
    const verified = await verifySessionToken(token)
    expect(verified).toBeNull()
  })
})

describe('getSecretKey', () => {
  it('returns null when neither AUTH_SECRET nor DATABASE_URL is set', () => {
    delete process.env.AUTH_SECRET
    delete process.env.DATABASE_URL
    expect(getSecretKey()).toBeNull()
  })

  it('falls back to a DATABASE_URL-derived key when AUTH_SECRET is absent', () => {
    delete process.env.AUTH_SECRET
    process.env.DATABASE_URL = 'postgres://example'
    expect(getSecretKey()).not.toBeNull()
  })
})
