// Ağıllı səsli telefon asistanı "Banu"
// - Brauzerdə istifadəçinin səsini tanıyır (SpeechRecognition: az-AZ)
// - Gemini API ilə söhbət aparır (Varsa; yoxdursa daxili ssenari ilə işləyir)
// - Cavab mətnini edge-tts (az-AZ-BanuNeural) ilə mp3-ə çevirib brauzerdə səsləndirir

import { createServer } from 'node:http'
import { readFileSync, existsSync, readFile, unlinkSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 3979

// .env faylını oxu (asılılıqsız, sadə parser)
const env = {}
const envPath = join(__dirname, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}
const GEMINI_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash'
const VOICE = env.TTS_VOICE || 'az-AZ-BanuNeural'

const SYSTEM_PROMPT = `Sən "VetKlinika" baytarlıq klinikasının telefon resepsiyon işçisisən. Adın Banudur.

QAYDALAR:
- Yalnız Azərbaycan dilində danış.
- Cavabların QISA olsun: 1-2 cümlə. Bu, canlı telefon danışığıdır, mühazirə deyil.
- Sən HƏKİM DEYİLSƏN. Heç vaxt diaqnoz qoyma, dərman adı vermə, müalicə tövsiyə etmə. Tibbi sual gələndə: "Bunu dəqiq həkimimiz müayinədə deyəcək" de və randevuya yönləndir.
- Təcili hal eşitsən (zəhərlənmə, qanaxma, huşunu itirmə, nəfəs ala bilmir) — dərhal de ki, təcili gəlsinlər, klinika hazırdır.
- Məqsədin: randevu üçün bu məlumatları TƏBİİ söhbətlə toplamaq (hamısını birdən soruşma, bir-bir):
  1. Heyvanın növü (it, pişik, quş...) və adı
  2. Gəliş səbəbi (peyvənd, müayinə, analiz...)
  3. İstənilən gün/saat
  4. Sahibin adı və telefon nömrəsi
- Hamısı toplananda təkrarla və de: "Müraciətinizi qeydə aldım, həkimimiz təsdiqlədikdən sonra sizə WhatsApp-la təsdiq mesajı gələcək."
- Empatik ol: narahat müştərini sakitləşdir, amma qısa saxla.
- Rəqəmləri sözlə de (məsələn "saat on beş" yox, "saat üç").
- Söhbət bitəndə cavabının SONUNA bu formatda gizli sətir əlavə et (yalnız bütün məlumat toplananda):
[SORGU]{"heyvan":"...","ad":"...","sebeb":"...","vaxt":"...","sahib":"...","telefon":"..."}[/SORGU]`

// Daxili ssenari beyin (API açarı olmayanda işləyir)
function fallbackBrain(history) {
  const userTurns = history.filter(h => h.role === 'user').length
  const last = (history[history.length - 1]?.text || '').toLowerCase()

  if (/zəhər|qanax|huş|nəfəs|ölür|təcili/.test(last))
    return 'Bu təcili haldır! Zəhmət olmasa heyvanınızı dərhal klinikamıza gətirin, həkimlərimiz hazır olacaq.'

  switch (userTurns) {
    case 1: return 'Salam, VetKlinikaya xoş gəlmisiniz! Hansı heyvanınız üçün müraciət edirsiniz və adı nədir?'
    case 2: return 'Çox gözəl. Gəlişinizin səbəbi nədir — peyvənd, müayinə, yoxsa başqa bir şey?'
    case 3: return 'Aydındır. Hansı gün və saat sizə uyğundur?'
    case 4: return 'Əla. Adınızı və əlaqə nömrənizi deyə bilərsiniz?'
    default: return 'Təşəkkür edirəm! Müraciətinizi qeydə aldım. Həkimimiz təsdiqlədikdən sonra sizə WhatsApp-la təsdiq mesajı gələcək. Gözəl gün arzulayıram!'
  }
}

// Gemini beyin
async function geminiBrain(history) {
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 200 }
      })
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    console.error('Gemini xətası:', res.status, errText.slice(0, 300))
    return null
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
}

// edge-tts: mətn -> mp3 baytları
function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const out = join(tmpdir(), `vetk-tts-${randomUUID()}.mp3`)
    const proc = spawn('python', ['-m', 'edge_tts', '--voice', VOICE, '--text', text, '--write-media', out], {
      windowsHide: true
    })
    let err = ''
    proc.stderr.on('data', d => { err += d })
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`edge-tts kodu ${code}: ${err.slice(0, 200)}`))
      readFile(out, (e, buf) => {
        try { unlinkSync(out) } catch {}
        if (e) reject(e); else resolve(buf)
      })
    })
    proc.on('error', reject)
  })
}

// Sorğu qeydləri
const sorgular = []

// HTTP server
const server = createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(readFileSync(join(__dirname, 'public', 'index.html')))
    return
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, brain: GEMINI_KEY ? `gemini (${GEMINI_MODEL})` : 'fallback-ssenari', voice: VOICE, sorgular: sorgular.length }))
    return
  }

  if (req.method === 'GET' && req.url === '/api/sorgular') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(sorgular))
    return
  }

  if (req.method === 'POST' && req.url === '/api/talk') {
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', async () => {
      try {
        const { history } = JSON.parse(body) // [{role:'user'|'assistant', text}]

        // Xüsusi hal: zəng başlayanda salamlamanı yalnız səsləndiririk
        if (history.length === 1 && history[0].text === '__salamla__') {
          const greeting = 'Salam! VetKlinikaya xoş gəlmisiniz, mən Banuyam. Sizə necə kömək edə bilərəm?'
          const audio = await textToSpeech(greeting)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ reply: greeting, audio: audio.toString('base64') }))
          return
        }

        let reply = null
        if (GEMINI_KEY) reply = await geminiBrain(history)
        if (!reply) reply = fallbackBrain(history)

        // Sorğunu çıxarmaq
        const m = reply.match(/\[SORGU\](.*?)\[\/SORGU\]/s)
        if (m) {
          try { sorgular.push({ ...JSON.parse(m[1]), vaxt_qeyd: new Date().toISOString() }); console.log('💬 Yeni sorğu:', m[1]) } catch {}
          reply = reply.replace(/\[SORGU\].*?\[\/SORGU\]/s, '').trim()
        }

        const audio = await textToSpeech(reply)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ reply, audio: audio.toString('base64') }))
      } catch (e) {
        console.error('talk xətası:', e.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  res.writeHead(404); res.end('yox')
})

server.listen(PORT, () => {
  console.log(`\n📞 VetKlinika Canlı AI Resepsiyon prototipi`)
  console.log(`   http://localhost:${PORT}`)
  console.log(`   Beyin: ${GEMINI_KEY ? 'Gemini (' + GEMINI_MODEL + ')' : 'daxili ssenari (GEMINI_API_KEY yoxdur — .env faylına yazın)'}`)
  console.log(`   Səs:  ${VOICE}\n`)
})
