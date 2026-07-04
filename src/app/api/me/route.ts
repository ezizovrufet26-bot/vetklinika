import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

/** Cari istifadəçinin sessiya məlumatı (client komponentlər üçün) */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({
    authenticated: true,
    name: session.name,
    role: session.role,
    clinicId: session.clinicId ?? null,
  })
}
