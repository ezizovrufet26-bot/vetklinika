import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from '@/lib/auth'

/** Server komponent / server action / route handler daxilində cari sessiya */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}
