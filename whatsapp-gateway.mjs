import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys'
import qrcode from 'qrcode'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxrtxojca',
  api_key: process.env.CLOUDINARY_API_KEY || '459296421142521',
  api_secret: process.env.CLOUDINARY_API_SECRET || '7OduzOtTDkJgr9gVmPLnL-UlLsA',
});

// Store sock globally to be accessed by http server
let globalSock = null;

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    return res.end()
  }

  if (req.method === 'POST' && req.url === '/send') {
    let body = ''
    req.on('data', chunk => body += chunk.toString())
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body)
        if (!phone || !message) {
          res.writeHead(400)
          return res.end(JSON.stringify({ error: 'Phone and message required' }))
        }

        if (globalSock) {
          const sanitizedPhone = phone.replace(/\+/g, '')
          let jid = sanitizedPhone.includes('@') ? sanitizedPhone : sanitizedPhone + '@s.whatsapp.net'
          
          if (jid.includes(':')) {
            const [numPart, domainPart] = jid.split('@')
            jid = numPart.split(':')[0] + '@' + domainPart
          }

          console.log(`[GATEWAY] Sending message to ${jid}: ${message.substring(0, 50)}...`)
          
          await globalSock.sendMessage(jid, { text: message })
          
          console.log(`[GATEWAY] Successfully sent to ${jid}`)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ success: true }))
        } else {
          res.writeHead(503)
          return res.end(JSON.stringify({ error: 'WhatsApp not connected' }))
        }
      } catch (err) {
        res.writeHead(500)
        return res.end(JSON.stringify({ error: err.message }))
      }
    })
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(3001, () => {
  console.log('🔗 Internal WhatsApp Sender API listening on port 3001')
})

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  })
  
  globalSock = sock;

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n==================================================')
      console.log('📱 KLİNİKANIN WHATSAPP HESABINI BAĞLAMAQ ÜÇÜN QR KOD 📱')
      console.log('==================================================\n')
      
      const qrPath = path.join(process.cwd(), 'public', 'qr.png')
      qrcode.toFile(qrPath, qr, { color: { dark: '#000000', light: '#FFFFFF' } }, function (err) {
        if (err) console.error('QR yaratma xətası:', err);
        console.log('✅ QR KOD YADDA SAXLANILDI: Ayarlar bölməsindən skan edin!');
      });

      const statusPath = path.join(process.cwd(), 'public', 'whatsapp-status.json')
      fs.writeFileSync(statusPath, JSON.stringify({ status: 'waiting_qr', timestamp: Date.now() }))
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Bağlantı kəsildi, yenidən bağlanır...', shouldReconnect)
      
      const statusPath = path.join(process.cwd(), 'public', 'whatsapp-status.json')
      fs.writeFileSync(statusPath, JSON.stringify({ status: 'disconnected', timestamp: Date.now() }))

      if (shouldReconnect) {
        connectToWhatsApp()
      }
    } else if (connection === 'open') {
      console.log('\n✅ WHATSAPP UĞURLA BAĞLANDI! SİSTEM REAL MESAJLARI QƏBUL EDİR. ✅\n')
      
      const statusPath = path.join(process.cwd(), 'public', 'whatsapp-status.json')
      fs.writeFileSync(statusPath, JSON.stringify({ status: 'connected', timestamp: Date.now() }))
      
      // Delete QR code file since we are connected
      const qrPath = path.join(process.cwd(), 'public', 'qr.png')
      if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath)
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg || msg.key.fromMe || !msg.message) return

      const sender = msg.key.remoteJid
      if (!sender || sender.includes('@g.us')) return // Qrupları ötür

      let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
      let isAudio = false
      let audioUrl = null

      if (msg.message.audioMessage) {
        text = '[SƏSLİ MESAJ]'
        isAudio = true
        try {
          const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) })
          
          // Upload to Cloudinary Cloud Storage
          try {
            const uploadResult = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                { folder: 'vet-klinika/audio', resource_type: 'video' },
                (err, res) => err ? reject(err) : resolve(res)
              ).end(buffer)
            })
            audioUrl = uploadResult.secure_url
            console.log('☁️ Səs faylı Cloudinary-yə yükləndi:', audioUrl)
          } catch (cloudErr) {
            console.error('Cloudinary yükləmə xətası, yerli diskə yazılır:', cloudErr)
            const filename = `audio_${Date.now()}_${msg.key.id}.ogg`
            const dir = path.join(process.cwd(), 'public', 'uploads', 'audio')
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, filename), buffer)
            audioUrl = `/uploads/audio/${filename}`
          }
        } catch (e) {
          console.error('Audio download xətası:', e)
        }
      }

      if (!text && !isAudio) return

      // Extract base phone number and domain, ignoring device IDs (e.g. 1234567890:4@s.whatsapp.net -> 1234567890@s.whatsapp.net)
      const senderBase = sender.split('@')[0].split(':')[0]
      const domainPart = sender.split('@')[1] || 's.whatsapp.net'
      const baseJid = senderBase + '@' + domainPart
      const cleanPhone = '+' + senderBase.replace(/\D/g, '')

      console.log(`\n📥 GƏLƏN REAL MESAJ [${cleanPhone} (JID: ${baseJid})]: "${text}"`)

      // Localhook / Next.js Webhook-a göndər
      const response = await fetch('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, whatsappJid: baseJid, message: text, audioUrl, isAudio })
      })

      const data = await response.json()

      if (data.success && data.replyMessage) {
        console.log(`📤 AVTOMATİK YANIT GÖNDƏRİLİR: \n${data.replyMessage}\n`)
        await sock.sendMessage(baseJid, { text: data.replyMessage })
      }
    } catch (err) {
      console.error('Mesaj emalında xəta:', err)
    }
  })
}

connectToWhatsApp()
