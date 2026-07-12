// VetKlinika WhatsApp Gateway (whatsapp-web.js)
// Mətn mesajları + SƏSLİ MESAJ dialoqu (STT→beyin→TTS) + zəng yönləndirməsi.
//
// Baileys → whatsapp-web.js keçidi (2026-07-12): Baileys öz WA protokolunu
// yenidən yazır və Railway-dən bağlananda "connectionClosed (428)" ilə
// dövrə düşürdü (QR heç görünmədən). whatsapp-web.js əsl Chromium ilə
// WhatsApp Web-i təqlid edir — eyni Railway mühitində (Modern Ferma layihəsi)
// sübut olunmuş işlək yanaşmadır.
//
// Səs axını (Codex konsultasiyası ilə razılaşdırılıb, bax:
// ai-debate/transcripts/vet-voice-icra-2026-07-10/synthesis.md):
//   səsli mesaj → whisper-1 STT (az) → webhook (transcript audit obyekti ilə)
//   → beyin cavabı → Banu TTS → ogg/opus ptt voice note cavabı
// Qoruyucular: idempotency (mesaj ID), per-nömrə növbə, günlük limitlər,
//   2-6s insani gecikmə, manual-takeover susması, PII-təmiz loglar.

import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { v2 as cloudinary } from 'cloudinary'
import { fileURLToPath } from 'node:url'
import { loadEnv, transcribeAudio, synthesizeSpeech, mp3ToOggOpus } from './voice-agent/voice-lib.mjs'

const { Client, LocalAuth, MessageMedia } = pkg

// ── Env: .env faylı + process.env (process.env üstündür) ────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fileEnv = loadEnv(__dirname)
const env = (k, d = '') => process.env[k] || fileEnv[k] || d

cloudinary.config({
  cloud_name: env('CLOUDINARY_CLOUD_NAME'),
  api_key: env('CLOUDINARY_API_KEY'),
  api_secret: env('CLOUDINARY_API_SECRET'),
})

const OPENAI_KEY = env('OPENAI_API_KEY')
const STT_MODEL = env('STT_MODEL', 'whisper-1')
const TTS_VOICE = env('TTS_VOICE', 'az-AZ-BanuNeural')
const WIDGET_URL = env('WIDGET_URL', '')
const APP_URL = env('APP_URL', 'https://vetklinika-aqkn.vercel.app')

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

function writeStatus(status, extra = {}) {
  const statusPath = path.join(process.cwd(), 'public', 'whatsapp-status.json')
  fs.writeFileSync(statusPath, JSON.stringify({ status, timestamp: Date.now(), ...extra }))
}

// ── Daxili HTTP API (panel buradan mesaj göndərir) ──────────────────────
let globalClient = null
let isReady = false // 'ready' hadisəsinədək true olmur — 'client' obyekti var deyə hazırdır demək deyil

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
        if (globalClient && isReady) {
          const chatId = toChatId(phone)
          console.log(`[GATEWAY] Manual göndərmə → ${chatId}: ${piiSafe(message, 50)}`)
          await globalClient.sendMessage(chatId, message)
          // Manual takeover: admin yazdı → bot bu söhbətdə 30 dəq susur
          manualTakeover.set(chatId, Date.now())
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

/** "+994501234567" / "994501234567" / jid → "994501234567@c.us" */
function toChatId(phone) {
  let clean = (phone || '').replace(/\+/g, '')
  if (clean.includes('@')) return clean
  return clean + '@c.us'
}

/** jid ("994501234567@c.us") → "+994501234567" */
function chatIdToPhone(chatId) {
  return '+' + (chatId.split('@')[0] || '').replace(/\D/g, '')
}

// ── Səsli cavab: mətn → Banu mp3 → ogg/opus → ptt voice note ───────────
async function sendVoiceReply(client, chatId, phone, replyText) {
  try {
    if (!canSendAudioReply(phone)) {
      console.log(`[VOICE] ${piiSafe(phone, 8)} günlük səsli cavab limitinə çatdı — mətn göndərilir`)
      await client.sendMessage(chatId, replyText)
      return
    }
    try {
      const chat = await client.getChatById(chatId)
      await chat.sendStateRecording()
    } catch { /* presence best-effort */ }

    const mp3 = await synthesizeSpeech(replyText, TTS_VOICE)
    if (!mp3) throw new Error('TTS null')
    const ogg = await mp3ToOggOpus(mp3)
    if (!ogg) throw new Error('ffmpeg null')

    const media = new MessageMedia('audio/ogg; codecs=opus', ogg.buffer.toString('base64'))
    await client.sendMessage(chatId, media, { sendAudioAsVoice: true })
    countAudioReply(phone)
    console.log(`[VOICE] 🔊 Səsli cavab göndərildi (${ogg.seconds || '?'}s)`)
  } catch (e) {
    console.error('[VOICE] Səsli cavab alınmadı, mətn fallback:', e.message)
    await client.sendMessage(chatId, replyText).catch(() => {})
  }
}

// Railway container fayl sistemi müvəqqətidir — hər deploy/restart-da sıfırlanır.
// Daimi Volume (/data) qoşulubsa, sessiya oradan davam edir; yoxdursa (lokal dev)
// layihə qovluğuna yazır.
const AUTH_DIR = fs.existsSync('/data')
  ? path.join('/data', 'wwebjs_auth')
  : 'wwebjs_auth'

function createClient() {
  return new Client({
    authStrategy: new LocalAuth({ dataPath: AUTH_DIR }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
    },
  })
}

function wireClient(client) {
  globalClient = client

  client.on('qr', (qr) => {
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

    writeStatus('waiting_qr')
  })

  client.on('ready', () => {
    console.log('\n✅ WHATSAPP UĞURLA BAĞLANDI! SİSTEM REAL MESAJLARI QƏBUL EDİR. ✅\n')
    isReady = true
    writeStatus('connected')

    const qrPath = path.join(process.cwd(), 'public', 'qr.png')
    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath)
  })

  client.on('auth_failure', (msg) => {
    console.error('[GATEWAY] Autentifikasiya xətası:', msg)
    isReady = false
    writeStatus('auth_failure', { message: msg })
  })

  let reconnecting = false
  client.on('disconnected', async (reason) => {
    if (reconnecting) return // ard-arda 'disconnected' hadisəsi ikiqat reconnect başlatmasın
    reconnecting = true
    console.log(`[GATEWAY] Bağlantı kəsildi — səbəb: ${reason}. Yenidən başladılır.`)
    isReady = false
    writeStatus('disconnected', { reason: String(reason) })
    globalClient = null

    // Köhnə Puppeteer/Chromium prosesini bağla — yoxsa hər reconnect-də
    // zombi brauzer instansı yığılır və konteyner yaddaşı tükənir.
    try { await client.destroy() } catch (e) { console.error('[GATEWAY] destroy xətası:', e.message) }

    // Ard-arda dövr (crash-loop) WA-nın sürət-limitinə düşməsin deyə qısa gecikmə.
    // LOGOUT halında da yenidən initialize həqiqi vəziyyəti (yeni QR tələbi) göstərəcək.
    setTimeout(() => {
      reconnecting = false
      const fresh = createClient()
      wireClient(fresh)
      fresh.initialize()
    }, 3000)
  })

  // ── Gələn ZƏNGLƏR: rədd et + widget-ə yönləndir (gündə 1 mesaj) ───────
  client.on('call', async (call) => {
    try {
      if (call.isGroup || !call.from) return
      const phone = chatIdToPhone(call.from)
      console.log(`[CALL] 📞 Gələn zəng: ${piiSafe(phone, 8)} — rədd edilir`)
      await call.reject().catch(e => console.error('[CALL] reject xətası:', e.message))

      if (dailyCallMsgs.get(phone) === today()) return // gündə 1 dəfə
      dailyCallMsgs.set(phone, today())

      await humanDelay()
      const widgetLine = WIDGET_URL ? `\n🎙 Və ya Banu ilə canlı danışın: ${WIDGET_URL}` : ''
      await client.sendMessage(
        call.from,
        `Salam! 🐾 Hazırda zəngə cavab verə bilmirik.\n\nSəsli mesaj göndərin — virtual resepşnimiz Banu sizə səslə cavab verəcək və randevonuzu qeydə alacaq.${widgetLine}\n\nTəcili hallarda birbaşa klinikaya gəlin.`
      ).catch(() => {})
    } catch (e) {
      console.error('[CALL] Zəng emalı xətası:', e.message)
    }
  })

  client.on('message', async (msg) => {
    try {
      if (msg.fromMe) return
      const chatId = msg.from
      if (!chatId || chatId.endsWith('@g.us')) return // Qrupları ötür
      if (msg.isStatus || chatId === 'status@broadcast') return // WA "status" yayımlarını ötür

      // İdempotency: eyni mesajı iki dəfə emal etmə (retry/resync halları)
      const msgId = msg.id?._serialized
      if (msgId) {
        if (processedMsgIds.has(msgId)) return
        rememberMsg(msgId)
      }

      const cleanPhone = chatIdToPhone(chatId)

      // Manual takeover: admin bu söhbətdə yazıbsa bot susur
      const tk = manualTakeover.get(chatId)
      if (tk && Date.now() - tk < TAKEOVER_MS) {
        console.log(`[GATEWAY] ${piiSafe(cleanPhone, 8)} — manual takeover aktivdir, bot susur`)
        return
      }

      let text = msg.body || ''
      const isAudio = msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')
      let audioUrl = null
      let transcript = null

      if (isAudio) {
        let buffer = null
        try {
          const media = await msg.downloadMedia()
          if (media?.data) buffer = Buffer.from(media.data, 'base64')
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
          await client.sendMessage(chatId, failText).catch(() => {})
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
            whatsappJid: chatId,
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
            await sendVoiceReply(client, chatId, cleanPhone, data.replyMessage)
          } else {
            console.log(`📤 Mətn cavabı göndərilir (${data.replyMessage.length} simvol)`)
            await client.sendMessage(chatId, data.replyMessage)
          }
        }
      })
    } catch (err) {
      console.error('Mesaj emalında xəta:', err)
    }
  })
}

const client = createClient()
wireClient(client)
client.initialize()
