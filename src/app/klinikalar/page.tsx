import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MapPin, Phone, MessageCircle, Sparkles, Building2, UserRound, Search,
  ShieldCheck, Siren,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { normalizeTelHref, normalizeWhatsAppNumber } from '@/lib/directory'
import PublicShell from '@/components/directory/PublicShell'
import JoinCta from '@/components/directory/JoinCta'
import Badge from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Baytarlıq Klinikaları Kataloqu — Azərbaycanın etibarlı baytar klinikaları',
  description:
    'Şəhərinizdəki etibarlı baytarlıq klinikalarını tapın: xidmətlər, həkimlər, iş saatları, ünvan və bir toxunuşla WhatsApp əlaqəsi. VetKlinika tərəfdaş şəbəkəsi.',
}

type SearchParams = Promise<{ seher?: string; xidmet?: string }>

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const { seher, xidmet } = await searchParams

  const clinics = await prisma.clinic.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: { doctors: { where: { isPublished: true } } },
  })

  // Filtr seçimləri dərc olunmuş klinikalardan törədilir
  const cities = [...new Set(clinics.map(c => c.city).filter((c): c is string => !!c))].sort()
  const services = [...new Set(clinics.flatMap(c => c.services))].sort()

  const filtered = clinics.filter(c => {
    if (seher && c.city !== seher) return false
    if (xidmet && !c.services.includes(xidmet)) return false
    return true
  })

  const doctorCount = clinics.reduce((sum, c) => sum + c.doctors.length, 0)

  return (
    <PublicShell>
      {/* Hero */}
      <section className="bg-aurora border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <Badge tone="primary" className="mb-5">
            <ShieldCheck className="w-3.5 h-3.5" /> VetKlinika Tərəfdaş Şəbəkəsi
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight">
            Azərbaycanın etibarlı<br /><span className="text-gradient">baytar klinikaları</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-4 max-w-xl mx-auto">
            Dostunuz üçün yaxınlıqdakı peşəkar klinikanı tapın — xidmətlər, həkimlər,
            iş saatları və bir toxunuşla WhatsApp əlaqəsi.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm font-bold text-muted-foreground">
            <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> {clinics.length} klinika</span>
            <span className="flex items-center gap-2"><UserRound className="w-4 h-4 text-primary" /> {doctorCount} həkim</span>
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {cities.length || 1} şəhər</span>
          </div>

          {/* Server-side filter */}
          <form method="get" className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <select name="seher" defaultValue={seher || ''}
              className="flex-1 px-4 py-3 bg-card border border-input rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-ring/30">
              <option value="">Bütün şəhərlər</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="xidmet" defaultValue={xidmet || ''}
              className="flex-1 px-4 py-3 bg-card border border-input rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-ring/30">
              <option value="">Bütün xidmətlər</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Axtar
            </button>
          </form>
        </div>
      </section>

      {/* Klinika kartları */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-bold">Bu filtrə uyğun klinika tapılmadı.</p>
            <Link href="/klinikalar" className="text-primary font-bold text-sm hover:underline mt-2 inline-block">
              Bütün klinikalara bax →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((clinic, idx) => {
              const wa = normalizeWhatsAppNumber(clinic.whatsappNumber)
              const tel = normalizeTelHref(clinic.publicPhone)
              return (
                <div key={clinic.id} className="contents">
                  <div className="bg-card border border-border rounded-2xl shadow-soft hover:shadow-premium transition-all overflow-hidden flex flex-col">
                    {/* Örtük */}
                    <Link href={`/klinikalar/${clinic.slug}`} className="block relative h-40 bg-gradient-to-br from-primary/15 to-accent/10">
                      {clinic.coverPhotoUrl ? (
                        <img src={clinic.coverPhotoUrl} alt={clinic.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                      {clinic.isVetKlinikaTenant && (
                        <span className="absolute top-3 right-3">
                          <Badge tone="primary" className="bg-card/90 backdrop-blur">
                            <Sparkles className="w-3 h-3" /> 24/7 AI randevu
                          </Badge>
                        </span>
                      )}
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0 -mt-10 relative z-10 shadow-soft">
                          {clinic.logoUrl
                            ? <img src={clinic.logoUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-lg">🏥</span>}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/klinikalar/${clinic.slug}`}>
                            <h2 className="font-extrabold text-foreground truncate hover:text-primary transition-colors">{clinic.name}</h2>
                          </Link>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {[clinic.city, clinic.district].filter(Boolean).join(', ') || 'Azərbaycan'}
                          </p>
                        </div>
                      </div>

                      {/* Xidmət çipləri */}
                      {clinic.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {clinic.services.slice(0, 4).map(s => (
                            <span key={s} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-secondary text-muted-foreground border border-border">{s}</span>
                          ))}
                          {clinic.services.length > 4 && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg text-muted-foreground">+{clinic.services.length - 4}</span>
                          )}
                        </div>
                      )}

                      {clinic.emergencyAvailable && (
                        <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-3">
                          <Siren className="w-3.5 h-3.5" /> Təcili yardım mövcuddur
                        </p>
                      )}

                      {/* Konversiya №1: kartın üstündə birbaşa əlaqə */}
                      <div className="flex gap-2 mt-auto pt-4">
                        {wa && (
                          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-success text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 transition-all shadow-soft">
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                          </a>
                        )}
                        {tel && (
                          <a href={`tel:${tel}`}
                            className="flex-1 py-2.5 bg-secondary text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-muted transition-all border border-border">
                            <Phone className="w-4 h-4" /> Zəng et
                          </a>
                        )}
                        <Link href={`/klinikalar/${clinic.slug}`}
                          className="px-3 py-2.5 bg-primary-soft text-primary text-xs font-bold rounded-xl flex items-center justify-center hover:brightness-105 transition-all border border-primary/15">
                          Ətraflı
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Klinika-sahibi CTA — ilk 3 kartdan sonra (Codex: yalnız səhifə sonunda yox) */}
                  {idx === 2 && filtered.length > 3 && (
                    <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg">Klinika sahibisiniz?</h3>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                          Pulsuz siyahıya düşün — üstəlik 24/7 AI resepşn müştərilərinizin WhatsApp randevularını avtomatik qəbul etsin.
                        </p>
                      </div>
                      <JoinCta size="md" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Alt CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 text-center shadow-soft">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold">
            Klinikanız burada <span className="text-gradient">görünmür?</span>
          </h2>
          <p className="text-muted-foreground font-medium mt-3 max-w-lg mx-auto">
            VetKlinika tərəfdaş şəbəkəsinə pulsuz qoşulun: peşəkar profil səhifəsi,
            WhatsApp müştəri axını və istəsəniz — sizin üçün 24/7 işləyən AI resepşn.
          </p>
          <div className="mt-6 flex justify-center">
            <JoinCta size="lg" />
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
