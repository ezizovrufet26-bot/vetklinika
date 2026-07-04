'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSessionToken, normalizeIdentifier, SESSION_COOKIE } from '@/lib/auth'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get('identifier') || '')
  const password = String(formData.get('password') || '')

  if (!identifier.trim() || !password) {
    return { error: 'Email/telefon və parol daxil edilməlidir.' }
  }

  const { email, phone } = normalizeIdentifier(identifier)

  let user
  try {
    user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
    })
  } catch (e) {
    console.error('Login DB error:', e)
    return { error: 'Verilənlər bazasına qoşulmaq mümkün olmadı. Env dəyişənlərini yoxlayın.' }
  }

  if (!user || !user.isActive) {
    return { error: 'İstifadəçi tapılmadı və ya hesab deaktivdir.' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: 'Parol yanlışdır.' }
  }

  const token = await createSessionToken({
    sub: user.id,
    name: user.name,
    role: user.role,
    clinicId: user.clinicId,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/')
}
