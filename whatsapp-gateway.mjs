// VetKlinika WhatsApp Gateway (Baileys)
// Mətn mesajları + SƏSLİ MESAJ dialoqu (STT→beyin→TTS) + zəng yönləndirməsi.
//
// Səs axını (Codex konsultasiyası ilə razılaşdırılıb, bax:
// ai-debate/transcripts/vet-voice-icra-2026-07-10/synthesis.md):
//   səsli mesaj → whisper-1 STT (az) → webhook (transcript audit obyekti ilə)
//   → beyin cavabı → Banu TTS → ogg/opus ptt voice note cavabı
// Qoruyucular: idempotency (mesaj ID), per-nömrə növbə, günlük limitlər,
//   2-6s insani gecikmə, manual-takeover susması, PII-təmiz loglar.

import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadMediaMessage, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys'
import qrcode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { v2 as cloudinary } from 'cloudinary'
import { fileURLToPath } from 'node:url'
import { loadEnv, transcribeAudio, synthesizeSpeech, mp3ToOggOpus } from './voice-agent/voice-lib.mjs'

// ── Env: .env faylı + process.env (process.env üstündür) ────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fileEnv = loadEnv(__dirname)
const env = (k, d = '') => process.env[k] || fileEnv[k] || d

cloudinary.config({
  cloud_name: env('CLOUDINARY_CLOUD_NAME', 'dxrtxojca'),
  api_key: env('CLOUDINARY_API_KEY', '459296421142521'),
  api_secret: env('CLOUDINARY_API_SECRET', 'ErJ_jGmUDh9UD7Ft6kG5T9kWKx0'),
})

const OPENAI_KEY = env('OPENAI_API_KEY')
const STT_MODEL = env('STT_MODEL', 'whisper-1')
const TTS_VOICE = env('TTS_VOICE', 'az-AZ-BanuNeural')
const WIDGET_URL = env('WIDGET_URL', '')
const APP_URL = env('APP_URL', 'http://localhost:3000')

// ── Qoruyucu vəziyyət (in-memory; restart-da sıfırlanır — pilot üçün qəbul) ──
const processedMsgIds = new Set()            // idempotency: eyni mesaj iki dəfə emal olunmasın
const MAX_PROCESSED = 2000
const phoneLocks = new Map()                 // per-nömrə ardıcıl emal
const dailyAudioReplies = new Map()          // nömrə → {date, count}; gündə maks 12 səsli cavab
const dailyCallMsgs = new Map()              // nömrə → date; zəng auto-mesajı gündə 1 dəfə
const manualTakeover = new Map()             // jid → timestamp; admin yazandan sonra 30 dəq bot susur
const TAKEOVER_MS = 30 * 60 * 1000
const MAX_AUDIO_REPLIES_PER_DAY = 12

const today = () => new Date().toISOString().slice(0, 10)
const humanDelay = () => new Promise(r => setTimeout(r, 2000 + Math.random() * 4000))
const piiSafe = (s, n = 40) => (s || '').slice(0, n) + ((s || '').length > n ? '…' : '')

function rememberMsg(id) {
  if (processedMsgIds.size >= MAX_PROCESSED) {
    // ən köhnələri təmizlə (Set iterasiya sırası daxiletmə sırasıdır)
    for (const old of processedMsgIds) { processedMsgIds.delete(old); if (processedMsgIds.size < MAX_PROCESSED / 2) break }
  }
  processedMsgIds.add(id)
}

async function withPhoneLock(phone, fn) {
  const prev = phoneLocks.get(phone) || Promise.resolve()
  const next = prev.then(fn, fn)
  phoneLocks.set(phone, next.catch(() => {}))
  try { return await next } finally { if (phoneLocks.get(phone) === next) phoneLocks.delete(phone) }
}

function canSendAudioReply(phone) {
  const rec = dailyAudioReplies.get(phone)
  if (!rec || rec.date !== today()) return true
  return rec.count < MAX_AUDIO_REPLIES_PER_DAY
}
function countAudioReply(phone) {
  const rec = dailyAudioReplies.get(phone)
  if (!rec || rec.date !== today()) dailyAudioReplies.set(phone, { date: today(), count: 1 })
  else rec.count++
}

// ── Daxili HTTP API (panel buradan mesaj göndərir) ──────────────────────
let globalSock = null

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end() }

  // Telefon kamerası ilə skan üçün QR-i birbaşa göstər — public/qr.png-in
  // heç bir static-file server-i yoxdur, bura olmadan fayl əlçatan deyildi.
  if (req.method === 'GET' && req.url === '/qr') {
    const qrPath = path.join(process.cwd(), 'public', 'qr.png')
    if (fs.existsSync(qrPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' })
      return fs.createReadStream(qrPath).pipe(res)
    }
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('QR hazır deyil — ya artıq bağlanıb, ya da hələ yaradılmayıb. `railway logs` yoxlayın.')
  }

  if (req.method === 'GET' && req.url === '/status') {
    const statusPath = path.join(process.cwd(), 'public', 'whatsapp-status.json')
    const body = fs.existsSync(statusPath) ? fs.readFileSync(statusPath, 'utf-8') : JSON.stringify({ status: 'unknown' })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(body)
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
          console.log(`[GATEWAY] Manual göndərmə → ${jid}: ${piiSafe(message, 50)}`)
          await globalSock.sendMessage(jid, { text: message })
          // Manual takeover: admin yazdı → bot bu söhbətdə 30 dəq susur
          manualTakeover.set(jid, Date.now())
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

// Railway (və bənzər host-lar) PORT env-i ilə öz portunu təyin edir — sərt
// kodlaşdırılmış 3001 həmin platformalarda 502 ("Application failed to
// respond") ilə nəticələnir, çünki proxy başqa portu gözləyir.
const PORT = parseInt(process.env.PORT || '3001', 10)
server.listen(PORT, () => {
  console.log(`🔗 Internal WhatsApp Sender API listening on port ${PORT}`)
})

// ── Səsli cavab: mətn → Banu mp3 → ogg/opus → ptt voice note ───────────
async function sendVoiceReply(sock, jid, phone, replyText) {
  try {
    if (!canSendAudioReply(phone)) {
      console.log(`[VOICE] ${piiSafe(phone, 8)} günlük səsli cavab limitinə çatdı — mətn göndərilir`)
      await sock.sendMessage(jid, { text: replyText })
      return
    }
    await sock.sendPresenceUpdate('recording', jid).catch(() => {})
    const mp3 = await synthesizeSpeech(replyText, TTS_VOICE)
    if (!mp3) throw new Error('TTS null')
    const ogg = await mp3ToOggOpus(mp3)
    if (!ogg) throw new Error('ffmpeg null')
    await sock.sendMessage(jid, {
      audio: ogg.buffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      seconds: ogg.seconds || undefined
    })
    countAudioReply(phone)
    console.log(`[VOICE] 🔊 Səsli cavab göndərildi (${ogg.seconds || '?'}s)`)
  } catch (e) {
    console.error('[VOICE] Səsli cavab alınmadı, mətn fallback:', e.message)
    await sock.sendMessage(jid, { text: replyText }).catch(() => {})
  }
}

// Railway container fayl sistemi müvəqqətidir — hər deploy/restart-da sıfırlanır.
// Daimi Volume (/data) qoşulubsa, sessiya oradan davam edir; yoxdursa (lokal dev)
// layihə qovluğuna yazır.
const AUTH_DIR = fs.existsSync('/data')
  ? path.join('/data', 'baileys_auth_info')
  : 'baileys_auth_info'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

  // WA server-i köhnə protokol versiyası ilə gələn qoşulmaları dərhal kəsir —
  // QR tükənmədən "bağlan, kəs, təzə QR" dövrünə düşməyin ən çox rast gəlinən
  // səbəbi budur. version sərt kodlaşdırılmır, hər cəhddə canlı sorğulanır.
  const { version } = await fetchLatestBaileysVersion()
  console.log(`[GATEWAY] Baileys WA versiyası: ${version.join('.')}`)

  const sock = makeWASocket({
    auth: state,
    version,
    browser: Browsers.macOS('Desktop'),
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  })

  globalSock = sock

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n==================================================')
      console.log('📱 KLİNİKANIN WHATSAPP HESABINI BAĞLAMAQ ÜÇÜN QR KOD 📱')
      console.log('==================================================\n')

      // ASCII QR — birbaşa `railway logs`-da görünür, ayrıca URL/fayl lazım deyil
      qrcodeTerminal.generate(qr, { small: true })

      const qrPath = path.join(process.cwd(), 'public', 'qr.png')
      qrcode.toFile(qrPath, qr, { color: { dark: '#000000', light: '#FFFFFF' } }, function (err) {
        if (err) console.error('QR yaratma xətası:', err)
        console.log('✅ QR KOD YADDA SAXLANILDI: Ayarlar bölməsindən skan edin!')
      })

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

  // ── Gələn ZƏNGLƏR: rədd et + widget-ə yönləndir (gündə 1 mesaj) ───────
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      try {
        if (call.status !== 'offer') continue
        const callerJid = call.from
        const phone = '+' + (callerJid.split('@')[0].split(':')[0] || '').replace(/\D/g, '')
        console.log(`[CALL] 📞 Gələn zəng: ${piiSafe(phone, 8)} — rədd edilir`)
        await sock.rejectCall(call.id, callerJid).catch(e => console.error('[CALL] reject xətası:', e.message))

        if (dailyCallMsgs.get(phone) === today()) continue // gündə 1 dəfə
        dailyCallMsgs.set(phone, today())

        await humanDelay()
        const widgetLine = WIDGET_URL ? `\n🎙 Və ya Banu ilə canlı danışın: ${WIDGET_URL}` : ''
        await sock.sendMessage(callerJid, {
          text: `Salam! 🐾 Hazırda zəngə cavab verə bilmirik.\n\nSəsli mesaj göndərin — virtual resepşnimiz Banu sizə səslə cavab verəcək və randevonuzu qeydə alacaq.${widgetLine}\n\nTəcili hallarda birbaşa klinikaya gəlin.`
        }).catch(() => {})
      } catch (e) {
        console.error('[CALL] Zəng emalı xətası:', e.message)
      }
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg || msg.key.fromMe || !msg.message) return

      const sender = msg.key.remoteJid
      if (!sender || sender.includes('@g.us')) return // Qrupları ötür

      // İdempotency: eyni mesajı iki dəfə emal etmə (retry/resync halları)
      const msgId = msg.key.id
      if (msgId) {
        if (processedMsgIds.has(msgId)) return
        rememberMsg(msgId)
      }

      // Extract base phone number and domain, ignoring device IDs
      const senderBase = sender.split('@')[0].split(':')[0]
      const domainPart = sender.split('@')[1] || 's.whatsapp.net'
      const baseJid = senderBase + '@' + domainPart
      const cleanPhone = '+' + senderBase.replace(/\D/g, '')

      // Manual takeover: admin bu söhbətdə yazıbsa bot susur
      const tk = manualTakeover.get(baseJid)
      if (tk && Date.now() - tk < TAKEOVER_MS) {
        console.log(`[GATEWAY] ${piiSafe(cleanPhone, 8)} — manual takeover aktivdir, bot susur`)
        return
      }

      let text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
      let isAudio = false
      let audioUrl = null
      let transcript = null

      if (msg.message.audioMessage) {
        isAudio = true
        let buffer = null
        try {
          buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) })
        } catch (e) {
          console.error('Audio download xətası:', e.message)
        }

        if (buffer) {
          // 1) Cloudinary-yə yüklə (panel playback üçün)
          try {
            const uploadResult = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                { folder: 'vet-klinika/audio', resource_type: 'video' },
                (err, res2) => err ? reject(err) : resolve(res2)
              ).end(buffer)
            })
            audioUrl = uploadResult.secure_url
            console.log('☁️ Səs faylı Cloudinary-yə yükləndi')
          } catch (cloudErr) {
            console.error('Cloudinary yükləmə xətası:', cloudErr.message)
            audioUrl = null
          }

          // 2) STT: whisper-1 (az)
          transcript = await transcribeAudio(buffer, { apiKey: OPENAI_KEY, model: STT_MODEL, filename: 'voice.ogg' })
          if (transcript.status === 'ok') {
            text = transcript.text
            console.log(`[STT] 📝 Transkript alındı (${text.length} simvol)`)
          }
        } else {
          transcript = { text: '', provider: 'openai', model: STT_MODEL, language: 'az', durationSec: null, status: 'failed' }
        }

        // STT alınmadısa: webhook-a boş mesaj GÖNDƏRMƏ, dostcasına cavab ver
        if (!transcript || transcript.status !== 'ok') {
          await humanDelay()
          const failText = transcript?.status === 'too_long'
            ? 'Səsli mesajınız çox uzundur 🙏 Zəhmət olmasa 1 dəqiqədən qısa göndərin və ya mətnlə yazın.'
            : 'Bağışlayın, səsinizi aça bilmədim 🙏 Zəhmət olmasa bir daha cəhd edin və ya mətnlə yazın.'
          await sock.sendMessage(baseJid, { text: failText }).catch(() => {})
          return
        }
      }

      if (!text) return

      console.log(`\n📥 GƏLƏN MESAJ [${piiSafe(cleanPhone, 8)}${isAudio ? ' · səsli' : ''}]: "${piiSafe(text)}"`)

      // Per-nömrə növbə: eyni nömrədən paralel emal olmasın
      await withPhoneLock(cleanPhone, async () => {
        const webhookUrl = `${APP_URL}/api/whatsapp/webhook`
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            whatsappJid: baseJid,
            message: text,
            audioUrl,
            isAudio,
            transcript,                       // audit obyekti (Codex tövsiyəsi)
            originalMessageType: isAudio ? 'audio' : 'text'
          })
        })

        const data = await response.json()

        if (data.success && data.replyMessage) {
          await humanDelay() // insani gecikmə (2-6s)
          if (isAudio) {
            // Səsə səslə cavab
            await sendVoiceReply(sock, baseJid, cleanPhone, data.replyMessage)
          } else {
            console.log(`📤 Mətn cavabı göndərilir (${data.replyMessage.length} simvol)`)
            await sock.sendMessage(baseJid, { text: data.replyMessage })
          }
        }
      })
    } catch (err) {
      console.error('Mesaj emalında xəta:', err)
    }
  })
}

connectToWhatsApp()
