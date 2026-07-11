import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

/**
 * Marşrut qoruması. Aşağıdakılar İCTİMAİDİR:
 *  - "/" (landing), "/login", "/forgot-password"
 *  - /api/whatsapp/* (webhook — xarici servis çağırır)
 *  - /api/cron/* (xatırlatma cron-u)
 *  - /api/access-requests POST (landing-dəki qeydiyyat forması)
 * Qalan hər şey etibarlı sessiya tələb edir.
 */

const PUBLIC_PATHS = ['/', '/login', '/forgot-password']
const PUBLIC_API_PREFIXES = ['/api/whatsapp', '/api/cron']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()
  // Landing-dəki müraciət forması login-siz POST edə bilməlidir;
  // GET/PATCH icazələri route daxilində rol ilə yoxlanılır.
  if (pathname.startsWith('/api/access-requests') && req.method === 'POST') {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (!session) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Statik fayllar və Next daxili yolları istisna
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|manifest\\.json|qr\\.png|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
}
