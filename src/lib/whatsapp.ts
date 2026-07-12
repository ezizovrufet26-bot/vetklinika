/**
 * WhatsApp Mesaj Göndərmə Servisi
 * Gateway ünvanı env-dən oxunur (WHATSAPP_GATEWAY_URL) — lokal dev-də
 * 127.0.0.1:3001-ə fallback edir. Production-da (Vercel) bu env dəyişəni
 * gateway-in canlı (məs. Railway) ünvanına işarə etməlidir, əks halda
 * göndərmə cəhdi hər zaman uğursuz olur (Vercel özü gateway-i host etmir).
 */
const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://127.0.0.1:3001'

/** "0505193969" / "+994505193969" / "994505193969" → "994505193969" (Azərbaycan) */
function normalizeAzPhone(raw: string): string {
  let digits = raw.replace(/[^\d]/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 9) digits = '994' + digits
  return digits
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  // Əgər jid formatındadırsa (məsələn @lid/@s.whatsapp.net), olduğu kimi saxla
  let cleanPhone = phone || ''
  if (cleanPhone.includes('@')) {
    if (cleanPhone.includes(':')) {
      const [numPart, domainPart] = cleanPhone.split('@')
      cleanPhone = numPart.split(':')[0] + '@' + domainPart
    }
  } else {
    cleanPhone = cleanPhone ? '+' + normalizeAzPhone(cleanPhone) : ''
  }

  console.log('--------------------------------------------------')
  console.log(`📱 WHATSAPP MESAJI GÖNDƏRİLİR 📱`)
  console.log(`Kimə: ${cleanPhone}`)
  console.log(`Mesaj: \n${message}`)
  console.log('--------------------------------------------------')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${GATEWAY_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error('WhatsApp Gateway HTTP xətası:', res.status)
      return { success: false, phone: cleanPhone, error: `Gateway HTTP ${res.status}` }
    }
    return { success: true, phone: cleanPhone }
  } catch (err: any) {
    console.error('WhatsApp Gateway əlçatan deyil:', err.message)
    return { success: false, phone: cleanPhone, error: err.message || 'Gateway əlçatan deyil' }
  }
}
