import { SignJWT, jwtVerify } from 'jose'

/**
 * Sessiya sistemi: HttpOnly cookie içində HS256 JWT.
 * Edge (middleware) və Node (server actions) mühitlərinin hər ikisində işləyir.
 * DİQQƏT: bu fayl edge-safe qalmalıdır — next/headers və prisma import ETMƏ.
 * Cookie oxuyan getSession() lib/session.ts-dədir.
 */

export const SESSION_COOKIE = 'vk_session'
const SESSION_DAYS = 30

export type SessionPayload = {
  sub: string // user id
  name: string
  role: 'SUPERADMIN' | 'ADMIN' | 'DOCTOR' | 'STAFF'
  clinicId?: string | null
}

/**
 * İmza açarı: AUTH_SECRET env-i varsa o, yoxdursa DATABASE_URL-dən törədilir
 * (DATABASE_URL onsuz da gizlidir; HMAC istənilən uzunluqda açarla işləyir).
 * Heç biri yoxdursa null — sessiyalar etibarsız sayılır, sistem çökmür.
 */
export function getSecretKey(): Uint8Array | null {
  const material =
    process.env.AUTH_SECRET ||
    (process.env.DATABASE_URL ? `vetklinika-session::${process.env.DATABASE_URL}` : null)
  if (!material) return null
  return new TextEncoder().encode(material)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const key = getSecretKey()
  if (!key) {
    throw new Error(
      'Sessiya açarı yaradıla bilmir: AUTH_SECRET və ya DATABASE_URL mühit dəyişəni təyin edilməyib.'
    )
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const key = getSecretKey()
  if (!key) return null
  try {
    const { payload } = await jwtVerify(token, key)
    if (!payload.sub || !payload.role) return null
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Giriş identifikatorunu normallaşdırır: email olduğu kimi, telefon +994-ə salınır */
export function normalizeIdentifier(raw: string): { email?: string; phone?: string } {
  const value = raw.trim()
  if (value.includes('@')) return { email: value.toLowerCase() }

  let digits = value.replace(/[^\d]/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1) // 0513779099 -> 513779099
  if (digits.length === 9) digits = '994' + digits // 513779099 -> 994513779099
  return { phone: '+' + digits }
}
