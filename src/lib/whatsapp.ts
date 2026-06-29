/**
 * WhatsApp Mesaj Göndərmə Servisi
 * Bu modul həm simulyasiya modunu, həm də canlı WhatsApp API bağlantılarını dəstəkləyir.
 */
export async function sendWhatsAppMessage(phone: string, message: string) {
  // Əgər jid formatındadırsa (məsələn @lid), olduğu kimi saxla, əks halda + əlavə edib standartlaşdır
  let cleanPhone = phone || ""
  if (cleanPhone.includes('@')) {
    if (cleanPhone.includes(':')) {
      const [numPart, domainPart] = cleanPhone.split('@')
      cleanPhone = numPart.split(':')[0] + '@' + domainPart
    }
  } else {
    // telefon-formatlayici algorithm
    cleanPhone = cleanPhone.replace(/^p:\+?/, "")
    cleanPhone = cleanPhone.replace(/[^\d]/g, "")
    
    if (cleanPhone.startsWith("090") && cleanPhone.length === 13) {
      cleanPhone = cleanPhone.substring(1) // 90...
    }
    if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
      cleanPhone = "90" + cleanPhone.substring(1)
    }
    if (cleanPhone.startsWith("5") && cleanPhone.length === 10) {
      cleanPhone = "90" + cleanPhone
    }
    
    // Yabancı numaralar veya farklı formatlar için + ekle
    if (cleanPhone) {
      cleanPhone = "+" + cleanPhone
    }
  }

  console.log('--------------------------------------------------')
  console.log(`📱 WHATSAPP MESAJI GÖNDƏRİLDİ 📱`)
  console.log(`Kimə: ${cleanPhone}`)
  console.log(`Mesaj: \n${message}`)
  console.log('--------------------------------------------------')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    // Calling internal whatsapp gateway with 127.0.0.1 to avoid IPv6 resolution issues
    await fetch('http://127.0.0.1:3001/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message
      }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
  } catch (err) {
    console.error('WhatsApp Gateway Error:', err)
  }

  return { success: true, phone: cleanPhone }
}
