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

export async function changePassword(_prev: any, formData: FormData) {
  const currentPassword = String(formData.get('currentPassword') || '')
  const newPassword = String(formData.get('newPassword') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Bütün xanaları doldurun.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Yeni şifrələr uyğun gəlmir.' }
  }

  if (newPassword.length < 6) {
    return { error: 'Yeni şifrə ən az 6 simvol olmalıdır.' }
  }

  const { getSession } = await import('@/lib/session')
  const session = await getSession()
  if (!session?.sub) {
    return { error: 'Sessiya tapılmadı. Zəhmət olmasa yenidən daxil olun.' }
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  if (!user) {
    return { error: 'İstifadəçi tapılmadı.' }
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return { error: 'Cari şifrə yanlışdır.' }
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.sub },
    data: { passwordHash: hash }
  })

  return { success: 'Şifrə uğurla dəyişdirildi!' }
}

export async function sendResetOtp(identifier: string) {
  if (!identifier.trim()) {
    return { error: 'Email və ya telefon nömrəsi daxil edin.' }
  }

  const { email, phone } = normalizeIdentifier(identifier)
  const user = await prisma.user.findFirst({
    where: email ? { email } : { phone }
  })

  if (!user) {
    return { error: 'Bu məlumatla qeydiyyatdan keçmiş istifadəçi tapılmadı.' }
  }

  // Generate 6-digit OTP
  const otpCode = String(Math.floor(100000 + Math.random() * 900000))
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode, otpExpires }
  })

  // Send via WhatsApp if user has phone, or if identifier is phone
  const targetPhone = user.phone || phone
  let sentWp = false
  if (targetPhone) {
    try {
      const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
      const wpMsg = `🏥 *VetKlinika Şifrə Sıfırlama*\n\nŞifrə sıfırlama kodunuz: *${otpCode}*\nBu kod 10 dəqiqə ərzində aktivdir. Xahiş edirik heç kimlə paylaşmayın.`
      await sendWhatsAppMessage(targetPhone, wpMsg)
      sentWp = true
    } catch (e) {
      console.error('Failed to send OTP via WhatsApp:', e)
    }
  }

  // Log to console (simulated Email)
  console.log(`\n====================================\n📧 OTP EMAIL (Simulated)\nKimə: ${user.email || user.phone}\nKOD: ${otpCode}\n====================================\n`)

  return { 
    success: `Təhlükəsizlik kodu ${sentWp ? 'WhatsApp nömrənizə və ' : ''}e-poçtunuza göndərildi.`, 
    userId: user.id 
  }
}

export async function resetPassword(data: { userId: string; code: string; newPass: string }) {
  if (!data.userId || !data.code || !data.newPass) {
    return { error: 'Bütün məlumatları doldurun.' }
  }

  if (data.newPass.length < 6) {
    return { error: 'Yeni şifrə ən az 6 simvol olmalıdır.' }
  }

  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!user || !user.otpCode || !user.otpExpires) {
    return { error: 'Bərpa tələbi etibarsızdır və ya vaxtı keçib.' }
  }

  if (user.otpExpires < new Date()) {
    return { error: 'Kodun vaxtı bitib. Zəhmət olmasa yenidən kod tələb edin.' }
  }

  if (user.otpCode !== data.code.trim()) {
    return { error: 'Daxil etdiyiniz kod yanlışdır.' }
  }

  const hash = await bcrypt.hash(data.newPass, 10)
  await prisma.user.update({
    where: { id: data.userId },
    data: {
      passwordHash: hash,
      otpCode: null,
      otpExpires: null
    }
  })

  return { success: 'Şifrəniz sıfırlandı. Yeni şifrə ilə daxil ola bilərsiniz.' }
}

