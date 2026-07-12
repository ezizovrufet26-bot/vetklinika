/**
 * VetKlinika AI Resepşn beyni — Gemini əsaslı, 2 çağırışlı arxitektura.
 *
 * Codex konsultasiyası qərarı (ai-debate/transcripts/vet-voice-icra-2026-07-10):
 * DB-yə yazan çıxarış təbii cavab mətnindən parse OLUNMUR — ayrıca strict-JSON
 * extractor çağırışı ilə edilir. Hər hansı mərhələ xəta versə null qayıdır və
 * webhook regex fallback-a keçir (source="regex_fallback").
 *
 * Çağırış 1: receptionistReply — müştəriyə təbii cavab (səsli cavablar TTS üçün
 *            emoji/markdown-sız).
 * Çağırış 2: extractIntake — action + slotlar, strict JSON, validasiyalı.
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const OPENAI_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export type IntakeAction =
  | 'urgent_escalation'
  | 'create_appointment'
  | 'ask_followup'
  | 'general_answer'
  | 'vaccine_inquiry'
  | 'invoice_inquiry'
  | 'visit_summary_inquiry'
  | 'appointment_status_inquiry'

export interface IntakeResult {
  action: IntakeAction
  species: string | null      // İt, Pişik, Quş...
  petName: string | null
  reason: string | null       // Peyvənd, Müayinə...
  dateTimeIso: string | null  // normalize edilmiş ISO (+04:00)
  ownerName: string | null
  confidence: number          // 0-10
}

export interface BrainInput {
  userText: string
  isAudio: boolean
  history: { role: 'user' | 'assistant'; text: string }[]  // son mesajlar (köhnədən yeniyə)
}

export interface BrainOutput {
  reply: string
  intake: IntakeResult
}

// ── Bakı vaxtı (UTC+4, DST yoxdur) ──────────────────────────────────────
function bakuNowIso(): string {
  const d = new Date(Date.now() + 4 * 3600_000)
  return d.toISOString().replace(/\.\d{3}Z$/, '+04:00')
}

// ── Gemini generateContent ──────────────────────────────────────────────
async function gemini(system: string, contents: { role: string; parts: { text: string }[] }[], maxTokens = 300): Promise<string | null> {
  if (!GEMINI_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: maxTokens,
            // Flash-tier "thinking" variants otherwise spend maxOutputTokens on internal
            // reasoning first, leaving little/nothing for the actual visible answer
            // (finishReason: MAX_TOKENS with a near-empty candidate). These are fast,
            // single-turn conversational/extraction calls — no extended reasoning needed.
            thinkingConfig: { thinkingBudget: 0 },
          }
        }),
        signal: AbortSignal.timeout(20_000)
      }
    )
    if (!res.ok) {
      console.error('[ai-brain] Gemini status:', res.status)
      return null
    }
    const data = await res.json()
    const parts = data.candidates?.[0]?.content?.parts
    const text = Array.isArray(parts) ? parts.map((p: any) => p.text || '').join('') : ''
    return text.trim() || null
  } catch (e: any) {
    console.error('[ai-brain] Gemini istisna:', e.message)
    return null
  }
}

// ── OpenAI Chat Completions — Gemini olmayanda / xəta verəndə fallback ──
async function openai(system: string, contents: { role: string; parts: { text: string }[] }[], maxTokens: number): Promise<string | null> {
  if (!OPENAI_KEY) return null
  try {
    const messages = [
      { role: 'system', content: system },
      ...contents.map(c => ({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts.map(p => p.text).join('\n') })),
    ]
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.error('[ai-brain] OpenAI status:', res.status)
      return null
    }
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (typeof raw !== 'string' || !raw.trim()) return null
    // GPT bəzən qadağan olunsa da markdown fence əlavə edir — Gemini heç vaxt etmir,
    // ona görə çağıran tərəf (məs. JSON extractor) fence-siz mətn gözləyir.
    const text = raw.trim().replace(/^```(?:\w+)?\s*/i, '').replace(/\s*```$/, '')
    return text.trim() || null
  } catch (e: any) {
    console.error('[ai-brain] OpenAI istisna:', e.message)
    return null
  }
}

/** Gemini əsas provayder; açar yoxdursa ya da çağırış uğursuz olsa OpenAI-a keçir. */
async function llm(system: string, contents: { role: string; parts: { text: string }[] }[], maxTokens = 300): Promise<string | null> {
  const geminiResult = await gemini(system, contents, maxTokens)
  if (geminiResult) return geminiResult
  return openai(system, contents, maxTokens)
}

function historyToContents(history: BrainInput['history'], userText: string) {
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }))
  contents.push({ role: 'user', parts: [{ text: userText }] })
  return contents
}

// ── Çağırış 1: təbii cavab ──────────────────────────────────────────────
const REPLY_PROMPT_BASE = `Sən "VetKlinika" baytarlıq klinikasının resepşn işçisisən. Adın Banudur.

QAYDALAR:
- Yalnız Azərbaycan dilində, QISA cavab ver: 1-3 cümlə.
- Sən HƏKİM DEYİLSƏN. Diaqnoz qoyma, dərman adı vermə, müalicə tövsiyə etmə.
  Tibbi suala: "Bunu həkimimiz müayinədə dəqiq deyəcək" deyib randevuya yönləndir.
- TƏCİLİ hal (zəhərlənmə, güclü qanaxma, huşsuzluq, nəfəs almada çətinlik, qıcolma):
  randevu təklif ETMƏ — "dərhal klinikamıza gəlin, həkimlərimiz hazırdır" de.
- Məqsəd: randevu üçün lazım olanları TƏBİİ söhbətlə, BİR-BİR soruşmaq:
  heyvanın növü və adı → gəliş səbəbi → istənilən gün/saat → sahibin adı.
  (Telefon nömrəsi artıq bizdə var — onu soruşma.)
- Hamısı məlum olanda təsdiqlə: "Müraciətinizi qeydə aldım, həkimimiz təsdiqlədikdən
  sonra sizə təsdiq mesajı gələcək."
- Empatik ol, amma uzatma. Müştərini tanıyırsansa (əvvəlki söhbətdən) təkrar soruşma.`

const REPLY_PROMPT_VOICE_SUFFIX = `
- Bu cavab SƏSLƏNDİRİLƏCƏK (səsli mesaj): emoji, ulduz, markdown İŞLƏTMƏ.
  Rəqəmləri sözlə de ("saat üç", "sabah günorta"). Sadə danışıq dili.`

const REPLY_PROMPT_TEXT_SUFFIX = `
- Bu, WhatsApp yazışmasıdır: 1-2 uyğun emoji istifadə edə bilərsən, markdown olmasın.`

export async function receptionistReply(input: BrainInput): Promise<string | null> {
  const system = REPLY_PROMPT_BASE + (input.isAudio ? REPLY_PROMPT_VOICE_SUFFIX : REPLY_PROMPT_TEXT_SUFFIX)
  return llm(system, historyToContents(input.history, input.userText), 250)
}

// ── Çağırış 2: strict JSON extractor ────────────────────────────────────
function extractorPrompt(): string {
  return `Sən baytarlıq klinikası söhbətindən struktur məlumat çıxaran analizatorsan.
Cavabın YALNIZ bir JSON obyekti olmalıdır — heç bir izahat, heç bir markdown fence.

İndiki vaxt (Bakı): ${bakuNowIso()}

Sxem:
{
  "action": "urgent_escalation" | "create_appointment" | "ask_followup" | "general_answer"
          | "vaccine_inquiry" | "invoice_inquiry" | "visit_summary_inquiry" | "appointment_status_inquiry",
  "species": string|null,      // "İt","Pişik","Quş","Dovşan" və s. — böyük hərflə
  "petName": string|null,
  "reason": string|null,       // "Peyvənd","Müayinə","Qan analizi","Diş təmizlənməsi" və s.
  "dateTimeIso": string|null,  // istənilən vaxt ISO 8601 (+04:00). "sabah saat 3" → sabahın tarixi T15:00:00+04:00
  "ownerName": string|null,
  "confidence": 0-10           // slotların bütövlükdə etibarlılığı
}

Qaydalar:
- "urgent_escalation": zəhərlənmə, güclü qanaxma, huşsuzluq, nəfəs çətinliyi, qıcolma sözləri keçirsə.
- "create_appointment": YALNIZ species + reason + vaxt niyyəti aydın olanda. Sahibin ARTIQ
  gözləyən/təsdiqlənmiş randevusu varsa və YENİ vaxt təklif edirsə, bu, vaxt DƏYİŞDİRMƏSİ kimi
  qəbul olunur (eyni action, sistem özü mövcud randevunu tapıb yeniləyəcək).
- "ask_followup": məlumat hələ natamamdır, söhbət davam edir.
- "general_answer": randevu/mövcud məlumatla bağlı olmayan sual (iş saatı, qiymət, ünvan).
- "vaccine_inquiry": heyvanın peyvənd vaxtı/tarixçəsi haqqında sual ("növbəti peyvənd nə vaxtdır",
  "peyvəndi olub, olmayıb").
- "invoice_inquiry": borc/ödəniş/faktura haqqında sual ("nə qədər borcum var", "faktura göndərin").
- "visit_summary_inquiry": keçmiş müayinə/diaqnoz/həkim qeydi haqqında sual ("həkim nə dedi",
  "son müayinədə nə çıxdı").
- "appointment_status_inquiry": mövcud randevunun statusu/vaxtı haqqında sual, YENİ vaxt təklifi
  OLMADAN ("randevum təsdiqləndimi", "neçədə gəlməliyəm").
- Tarix keçmişdə ola bilməz. "bu gün" → bu günün tarixi. Saat deyilməyibsə 15:00 götür.
- Bilmədiyini null yaz — uydurma.`
}

const VALID_ACTIONS: IntakeAction[] = [
  'urgent_escalation', 'create_appointment', 'ask_followup', 'general_answer',
  'vaccine_inquiry', 'invoice_inquiry', 'visit_summary_inquiry', 'appointment_status_inquiry',
]

function validateIntake(raw: string): IntakeResult | null {
  try {
    // Mümkün markdown fence-ləri təmizlə
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const obj = JSON.parse(cleaned)
    if (!VALID_ACTIONS.includes(obj.action)) return null

    // Tarix validasiyası: parse olunmalı və indi..+60 gün aralığında olmalı
    let dateTimeIso: string | null = null
    if (obj.dateTimeIso && typeof obj.dateTimeIso === 'string') {
      const d = new Date(obj.dateTimeIso)
      const now = Date.now()
      if (!isNaN(d.getTime()) && d.getTime() > now - 3600_000 && d.getTime() < now + 60 * 86400_000) {
        dateTimeIso = d.toISOString()
      }
    }

    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null)
    return {
      action: obj.action,
      species: str(obj.species),
      petName: str(obj.petName),
      reason: str(obj.reason),
      dateTimeIso,
      ownerName: str(obj.ownerName),
      confidence: typeof obj.confidence === 'number' ? Math.max(0, Math.min(10, obj.confidence)) : 5
    }
  } catch {
    return null
  }
}

export async function extractIntake(input: BrainInput): Promise<IntakeResult | null> {
  const convo = [...input.history, { role: 'user' as const, text: input.userText }]
    .map(h => `${h.role === 'user' ? 'Müştəri' : 'Banu'}: ${h.text}`)
    .join('\n')
  const raw = await llm(extractorPrompt(), [{ role: 'user', parts: [{ text: convo }] }], 300)
  if (!raw) return null
  return validateIntake(raw)
}

// ── Tam beyin: 2 çağırış, hər hansı xətada null (regex fallback) ────────
export async function runReceptionistBrain(input: BrainInput): Promise<BrainOutput | null> {
  const [reply, intake] = await Promise.all([
    receptionistReply(input),
    extractIntake(input)
  ])
  if (!reply || !intake) return null
  return { reply, intake }
}

// ── AI Scribe: vizit qeydi üçün SOAP formatlı qaralama ──────────────────
export interface SoapDraftInput {
  species: string
  patientName: string
  reason: string
  temperature: number | null
  weight: number | null
}

const SOAP_DRAFT_PROMPT = `Sən baytar həkiminə klinik qeyd yazmaqda kömək edən AI Scribe-san.
Verilən qısa məlumat əsasında SOAP formatında (Subjective/Objective/Assessment/Plan)
QISA, peşəkar bir qaralama yaz — Azərbaycan dilində, baytarlıq terminologiyası ilə.

Qaydalar:
- Hər bölmə üçün 1-2 qısa cümlə, ümumi 80-120 söz aralığında.
- Yalnız verilən məlumatdan çıxarıla bilən şeyləri yaz, uydurma tapılmayan simptom/nəticə yazma.
- Bu, YALNIZ qaralamadır — həkim özü yoxlayıb düzəldəcək, ona görə "yəqin ki" kimi
  ehtiyatlı ifadələr işlətmək məqbuldur, amma qeyd real klinik qeyd kimi oxunmalıdır.
- Başlıqları qısa saxla: "S:", "O:", "A:", "P:" formatında, markdown fence istifadə etmə.`

export async function draftSoapNote(input: SoapDraftInput): Promise<string | null> {
  const vitals = [
    input.temperature != null ? `Temperatur: ${input.temperature}°C` : null,
    input.weight != null ? `Çəki: ${input.weight}kg` : null,
  ].filter(Boolean).join(', ')

  const userText = [
    `Növ: ${input.species}`,
    `Pasiyent: ${input.patientName}`,
    `Ziyarət səbəbi: ${input.reason}`,
    vitals ? `Vitallar: ${vitals}` : null,
  ].filter(Boolean).join('\n')

  return llm(SOAP_DRAFT_PROMPT, [{ role: 'user', parts: [{ text: userText }] }], 300)
}
