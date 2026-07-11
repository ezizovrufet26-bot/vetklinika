/**
 * İctimai klinika kataloqu üçün köməkçilər: slug generasiyası, WhatsApp nömrə
 * normalizasiyası, iş saatları tipi. Xarici asılılıq yoxdur — hamısı testlənən
 * saf funksiyalardır.
 */

const AZ_CHAR_MAP: Record<string, string> = {
  ə: 'e', Ə: 'e',
  ü: 'u', Ü: 'u',
  ö: 'o', Ö: 'o',
  ı: 'i', I: 'i', İ: 'i',
  ç: 'c', Ç: 'c',
  ş: 's', Ş: 's',
  ğ: 'g', Ğ: 'g',
}

/** "Mərkəz Baytarlıq Klinikası" → "merkez-baytarliq-klinikasi" */
export function slugify(name: string): string {
  return name
    .split('')
    .map((ch) => AZ_CHAR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * WhatsApp nömrəsini wa.me üçün yalnız rəqəmlərə salır.
 * DB-dən gələn dəyər birbaşa href-ə düşməsin deyə hər renderdə bundan keçir.
 * "+994 50 123 45 67" → "994501234567"; boş/qeyri-rəqəm → null.
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) return null
  return digits
}

/**
 * Yerlik hal şəkilçisi ahəng qanunu ilə: Bakı → "Bakıda", Kürdəmir → "Kürdəmirdə".
 * Son saitə görə: incə (ə,e,i,ö,ü) → "də", qalın (a,ı,o,u) → "da".
 */
export function locativeSuffix(cityName: string): string {
  const vowels = 'əeiöüaıou'
  const front = 'əeiöü'
  for (let i = cityName.length - 1; i >= 0; i--) {
    const ch = cityName[i].toLowerCase()
    if (vowels.includes(ch)) return front.includes(ch) ? 'də' : 'da'
  }
  return 'da'
}

/** tel: linki üçün: "+994 50 123 45 67" → "+994501234567" */
export function normalizeTelHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return null
  return `+${digits}`
}

// ── İş saatları ─────────────────────────────────────────────────────────
// workingHours Json sahəsinin gözlənilən forması (OpeningHoursSpecification-ə uyğun):
// { mon: {open:"09:00", close:"19:00"} | null, tue: ..., ..., sun: null }
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]
export type DayHours = { open: string; close: string } | null
export type WorkingHours = Partial<Record<WeekdayKey, DayHours>>

export const WEEKDAY_LABELS_AZ: Record<WeekdayKey, string> = {
  mon: 'Bazar ertəsi',
  tue: 'Çərşənbə axşamı',
  wed: 'Çərşənbə',
  thu: 'Cümə axşamı',
  fri: 'Cümə',
  sat: 'Şənbə',
  sun: 'Bazar',
}

// schema.org OpeningHoursSpecification dayOfWeek dəyərləri
export const WEEKDAY_SCHEMA_ORG: Record<WeekdayKey, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

function parseHm(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm)
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** Json sahəsindən gələn dəyəri təhlükəsiz WorkingHours-a çevirir (zibil → boş). */
export function parseWorkingHours(raw: unknown): WorkingHours {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: WorkingHours = {}
  for (const key of WEEKDAY_KEYS) {
    const day = (raw as Record<string, unknown>)[key]
    if (day === null) { out[key] = null; continue }
    if (day && typeof day === 'object') {
      const { open, close } = day as { open?: unknown; close?: unknown }
      if (typeof open === 'string' && typeof close === 'string'
          && parseHm(open) !== null && parseHm(close) !== null) {
        out[key] = { open, close }
      }
    }
  }
  return out
}

/** Bakı vaxtına (UTC+4, DST yoxdur) görə "indi açıqdır?" statusu. */
export function openStatus(hours: WorkingHours, now: Date = new Date()): {
  isOpen: boolean
  todayLabel: string | null // "09:00 – 19:00" | "Bağlıdır"
} {
  const baku = new Date(now.getTime() + 4 * 3600_000)
  const dayIdx = baku.getUTCDay() // 0=sun..6=sat
  const key: WeekdayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[dayIdx]
  const today = hours[key]
  if (!today) return { isOpen: false, todayLabel: today === null ? 'Bağlıdır' : null }
  const nowMin = baku.getUTCHours() * 60 + baku.getUTCMinutes()
  const openMin = parseHm(today.open)
  const closeMin = parseHm(today.close)
  if (openMin === null || closeMin === null) return { isOpen: false, todayLabel: null }
  return {
    isOpen: nowMin >= openMin && nowMin < closeMin,
    todayLabel: `${today.open} – ${today.close}`,
  }
}
