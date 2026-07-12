/**
 * Email göndərmə servisi — SMTP (nodemailer) üzərində, provayderdən asılı deyil.
 *
 * Konfiqurasiya YALNIZ env-dən oxunur (kodda parol saxlanmır):
 *   SMTP_HOST   — məs. smtp.gmail.com
 *   SMTP_PORT   — 465 (SSL) və ya 587 (STARTTLS); default 465
 *   SMTP_USER   — göndərən hesabın email-i
 *   SMTP_PASS   — Gmail üçün "App Password" (adi parol deyil)
 *   SMTP_FROM   — göstərilən göndərən (istəyə görə; default SMTP_USER)
 *
 * Konfiqurasiya yoxdursa çökmür — {success:false, error} qaytarır ki, çağıran
 * tərəf WhatsApp kimi digər kanala keçə bilsin.
 */
import nodemailer, { type Transporter } from 'nodemailer'

const HOST = process.env.SMTP_HOST || ''
const PORT = parseInt(process.env.SMTP_PORT || '465', 10)
const USER = process.env.SMTP_USER || ''
const PASS = process.env.SMTP_PASS || ''
const FROM = process.env.SMTP_FROM || USER

export function isEmailConfigured(): boolean {
  return Boolean(HOST && USER && PASS)
}

// Serverless "warm" çağırışlar arasında transportu təkrar istifadə et
let cached: Transporter | null = null
function getTransport(): Transporter {
  if (cached) return cached
  cached = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465, // 465 = implicit SSL, 587 = STARTTLS
    auth: { user: USER, pass: PASS },
  })
  return cached
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: false, error: 'SMTP konfiqurasiya olunmayıb (SMTP_HOST/USER/PASS)' }
  }
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Alıcı email düzgün deyil' }
  }
  try {
    await getTransport().sendMail({
      from: `VetKlinika <${FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    })
    return { success: true }
  } catch (err: any) {
    console.error('Email göndərmə xətası:', err?.message)
    return { success: false, error: err?.message || 'Email göndərilə bilmədi' }
  }
}
