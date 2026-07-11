// voice-lib.mjs — VetKlinika ortaq səs kitabxanası
// Gateway (whatsapp-gateway.mjs) və voice-agent (server.mjs) tərəfindən istifadə olunur.
//
// İxraclar:
//   loadEnv(dir)                          — sadə .env parser
//   transcribeAudio(buffer, opts)         — STT: OpenAI gpt-4o-mini-transcribe (az)
//   synthesizeSpeech(text, voice)         — TTS adapter: msedge-tts → python edge-tts fallback → null
//   mp3ToOggOpus(mp3Buffer)               — ffmpeg: mp3 → WhatsApp ptt formatı (ogg/opus), validasiyalı
//
// Codex konsultasiyası (transcripts/vet-voice-icra-2026-07-10) qərarları:
//   - TTS: npm əsas, python fallback, mətn son fallback
//   - ffmpeg: 48kHz opus, exit=0 + dolu buffer + duration>0 yoxlanışı
//   - STT nəticəsi audit obyekti ilə qayıdır: {text, provider, model, language, durationSec, status}

import { spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync as rf } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ── .env parser (asılılıqsız) ───────────────────────────────────────────
export function loadEnv(dir) {
  const env = {}
  const p = join(dir, '.env')
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf-8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

// ── STT: OpenAI transcribe ──────────────────────────────────────────────
// buffer: audio baytları (ogg/opus WhatsApp voice note və ya mp3/wav)
// Qaytarır: { text, provider, model, language, durationSec, status }
// status: ok | failed | too_long | skipped
const MAX_AUDIO_BYTES = 3 * 1024 * 1024 // ~90s opus voice note təxmini limiti

export async function transcribeAudio(buffer, { apiKey, model = 'whisper-1', filename = 'voice.ogg' } = {}) {
  const meta = { text: '', provider: 'openai', model, language: 'az', durationSec: null, status: 'failed' }
  if (!apiKey) return { ...meta, status: 'skipped' }
  if (!buffer || buffer.length === 0) return meta
  if (buffer.length > MAX_AUDIO_BYTES) return { ...meta, status: 'too_long' }

  try {
    const form = new FormData()
    form.append('file', new Blob([buffer]), filename)
    form.append('model', model)
    form.append('language', 'az')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error('[voice-lib] STT xətası:', res.status, errBody.slice(0, 150))
      return meta
    }
    const data = await res.json()
    const text = (data.text || '').trim()
    if (!text) return meta
    return { ...meta, text, status: 'ok' }
  } catch (e) {
    console.error('[voice-lib] STT istisna:', e.message)
    return meta
  }
}

// ── TTS adapter ─────────────────────────────────────────────────────────
// synthesize(text, voice) -> mp3 Buffer | null (null = mətn fallback işlət)
let _msedgeTts = null
async function ttsViaNpm(text, voice) {
  try {
    if (!_msedgeTts) _msedgeTts = await import('msedge-tts')
    const { MsEdgeTTS, OUTPUT_FORMAT } = _msedgeTts
    const tts = new MsEdgeTTS()
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)
    const chunks = []
    for await (const c of audioStream) chunks.push(c)
    const buf = Buffer.concat(chunks)
    return buf.length > 0 ? buf : null
  } catch (e) {
    console.error('[voice-lib] npm TTS xətası (python fallback sınanır):', e.message)
    return null
  }
}

function ttsViaPython(text, voice) {
  return new Promise(resolve => {
    const out = join(tmpdir(), `vetk-tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`)
    const proc = spawn('python', ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', out], { windowsHide: true })
    proc.on('close', code => {
      try {
        if (code === 0 && existsSync(out)) {
          const buf = rf(out)
          rmSync(out, { force: true })
          return resolve(buf.length > 0 ? buf : null)
        }
      } catch {}
      resolve(null)
    })
    proc.on('error', () => resolve(null))
  })
}

export async function synthesizeSpeech(text, voice = 'az-AZ-BanuNeural') {
  if (!text || !text.trim()) return null
  const viaNpm = await ttsViaNpm(text, voice)
  if (viaNpm) return viaNpm
  return await ttsViaPython(text, voice)
}

// ── ffmpeg: mp3 → ogg/opus (WhatsApp ptt) ──────────────────────────────
// Codex tövsiyəsi: 48kHz, mono, 24k bitrate, voip profili, 20ms frame.
// Validasiya: exit=0, dolu buffer, duration > 0. Uğursuzsa null (mətn fallback).
export function mp3ToOggOpus(mp3Buffer) {
  return new Promise(resolve => {
    const dir = mkdtempSync(join(tmpdir(), 'vetk-ogg-'))
    const inPath = join(dir, 'in.mp3')
    const outPath = join(dir, 'out.ogg')
    const cleanup = () => { try { rmSync(dir, { recursive: true, force: true }) } catch {} }
    try { writeFileSync(inPath, mp3Buffer) } catch { cleanup(); return resolve(null) }

    const proc = spawn('ffmpeg', ['-y', '-i', inPath, '-vn', '-ac', '1', '-ar', '48000',
      '-c:a', 'libopus', '-b:a', '24k', '-application', 'voip', '-frame_duration', '20', outPath],
      { windowsHide: true })
    proc.on('close', code => {
      if (code !== 0 || !existsSync(outPath)) { cleanup(); return resolve(null) }
      let ogg = null
      try { ogg = rf(outPath) } catch { cleanup(); return resolve(null) }
      if (!ogg || ogg.length === 0) { cleanup(); return resolve(null) }
      // duration yoxlanışı ffprobe ilə
      const probe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath], { windowsHide: true })
      let durOut = ''
      probe.stdout.on('data', d => { durOut += d })
      probe.on('close', () => {
        const seconds = parseFloat(durOut.trim())
        cleanup()
        if (!seconds || seconds <= 0) return resolve(null)
        resolve({ buffer: ogg, seconds: Math.round(seconds) })
      })
      probe.on('error', () => { cleanup(); resolve({ buffer: ogg, seconds: null }) })
    })
    proc.on('error', () => { cleanup(); resolve(null) })
  })
}
