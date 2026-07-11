import { describe, it, expect } from 'vitest'
import {
  slugify,
  normalizeWhatsAppNumber,
  normalizeTelHref,
  parseWorkingHours,
  openStatus,
  locativeSuffix,
} from './directory'

describe('locativeSuffix (ahəng qanunu)', () => {
  it('back vowels take -da', () => {
    expect(locativeSuffix('Bakı')).toBe('da')
    expect(locativeSuffix('Quba')).toBe('da')
  })
  it('front vowels take -də', () => {
    expect(locativeSuffix('Kürdəmir')).toBe('də')
    expect(locativeSuffix('Gəncə')).toBe('də')
  })
})

describe('slugify', () => {
  it('transliterates Azerbaijani characters', () => {
    expect(slugify('Mərkəz Baytarlıq Klinikası')).toBe('merkez-baytarliq-klinikasi')
  })

  it('handles dotted İ and dotless ı correctly', () => {
    expect(slugify('İsmayıllı Şəhər Klinikası')).toBe('ismayilli-seher-klinikasi')
  })

  it('collapses punctuation/spaces into single dashes and trims edges', () => {
    expect(slugify('  Vet & Pet -- Clinic!  ')).toBe('vet-pet-clinic')
  })

  it('caps length at 80 characters', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80)
  })
})

describe('normalizeWhatsAppNumber', () => {
  it('strips everything except digits', () => {
    expect(normalizeWhatsAppNumber('+994 50 123 45 67')).toBe('994501234567')
  })

  it('rejects injection attempts — non-digit garbage yields null or clean digits only', () => {
    // DB-dən gələ biləcək zərərli dəyər href-ə düşməməlidir
    expect(normalizeWhatsAppNumber('javascript:alert(1)')).toBe(null)
    expect(normalizeWhatsAppNumber('"><script>')).toBe(null)
  })

  it('rejects too-short and too-long values', () => {
    expect(normalizeWhatsAppNumber('12345')).toBe(null)
    expect(normalizeWhatsAppNumber('1'.repeat(20))).toBe(null)
  })

  it('returns null for empty input', () => {
    expect(normalizeWhatsAppNumber(null)).toBe(null)
    expect(normalizeWhatsAppNumber('')).toBe(null)
  })
})

describe('normalizeTelHref', () => {
  it('produces a +digits tel target', () => {
    expect(normalizeTelHref('012 345 67 89')).toBe('+0123456789')
  })
  it('rejects garbage', () => {
    expect(normalizeTelHref('zəng edin')).toBe(null)
  })
})

describe('parseWorkingHours', () => {
  it('accepts a valid week structure', () => {
    const parsed = parseWorkingHours({ mon: { open: '09:00', close: '19:00' }, sun: null })
    expect(parsed.mon).toEqual({ open: '09:00', close: '19:00' })
    expect(parsed.sun).toBe(null)
  })

  it('drops malformed day entries instead of crashing', () => {
    const parsed = parseWorkingHours({ mon: { open: '9am', close: 'gec' }, tue: 'yox' })
    expect(parsed.mon).toBeUndefined()
    expect(parsed.tue).toBeUndefined()
  })

  it('returns empty object for garbage input', () => {
    expect(parseWorkingHours('zibil')).toEqual({})
    expect(parseWorkingHours(null)).toEqual({})
    expect(parseWorkingHours([1, 2])).toEqual({})
  })
})

describe('openStatus', () => {
  // 2026-07-15 çərşənbədir; Bakı = UTC+4
  const wednesdayNoonUtc = new Date('2026-07-15T08:00:00Z') // Bakıda 12:00

  it('reports open during working hours (Baku time)', () => {
    const s = openStatus({ wed: { open: '09:00', close: '19:00' } }, wednesdayNoonUtc)
    expect(s.isOpen).toBe(true)
    expect(s.todayLabel).toBe('09:00 – 19:00')
  })

  it('reports closed outside working hours', () => {
    const lateUtc = new Date('2026-07-15T18:00:00Z') // Bakıda 22:00
    const s = openStatus({ wed: { open: '09:00', close: '19:00' } }, lateUtc)
    expect(s.isOpen).toBe(false)
  })

  it('reports closed on an explicitly-null day', () => {
    const s = openStatus({ wed: null }, wednesdayNoonUtc)
    expect(s.isOpen).toBe(false)
    expect(s.todayLabel).toBe('Bağlıdır')
  })
})
