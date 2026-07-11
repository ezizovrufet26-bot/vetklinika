import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin, Phone, MessageCircle, Sparkles, Building2, UserRound, Clock,
  Navigation, Siren, ShieldCheck, ArrowLeft, Bot, Trophy, Banknote,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import {
  normalizeTelHref, normalizeWhatsAppNumber, parseWorkingHours, openStatus,
  parsePriceList, WEEKDAY_KEYS, WEEKDAY_LABELS_AZ, WEEKDAY_SCHEMA_ORG, locativeSuffix,
} from '@/lib/directory'
import PublicShell from '@/components/directory/PublicShell'
import JoinCta from '@/components/directory/JoinCta'
import Badge from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

async function getClinic(slug: string) {
  return prisma.clinic.findFirst({
    where: { slug, isPublished: true },
    include: { doctors: { where: { isPublished: true }, orderBy: { displayOrder: 'asc' } } },
  })
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const clinic = await getClinic(slug)
  if (!clinic) return { title: 'Klinika tapılmadı' }
  const cityPart = clinic.city ? `${clinic.city}${locativeSuffix(clinic.city)} baytar klinikası — ` : ''
  return {
    title: `${cityPart}${clinic.name}`,
    description:
      clinic.description?.slice(0, 155) ||
      `${clinic.name}: xidmətlər, həkimlər, iş saatları və əlaqə. VetKlinika tərəfdaş şəbəkəsi.`,
    openGraph: {
      title: clinic.name,
      images: clinic.coverPhotoUrl ? [clinic.coverPhotoUrl] : undefined,
    },
  }
}

export default async function ClinicProfilePage({ params }: { params: Params }) {
  const { slug } = await params
  const clinic = await getClinic(slug)
  if (!clinic) notFound()

  const wa = normalizeWhatsAppNumber(clinic.whatsappNumber)
  const tel = normalizeTelHref(clinic.publicPhone)
  const hours = parseWorkingHours(clinic.workingHours)
  const status = openStatus(hours)
  const hasHours = Object.keys(hours).length > 0
  const priceList = parsePriceList(clinic.priceList)
  const directionsUrl =
    clinic.latitude != null && clinic.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`
      : clinic.googlePlaceUrl

  // schema.org VeterinaryCare — yerli axtarış üçün strukturlaşdırılmış data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: clinic.name,
    ...(clinic.description ? { description: clinic.description } : {}),
    ...(clinic.logoUrl ? { logo: clinic.logoUrl } : {}),
    ...(clinic.coverPhotoUrl ? { image: clinic.coverPhotoUrl } : {}),
    ...(clinic.publicPhone ? { telephone: clinic.publicPhone } : {}),
    ...(clinic.address || clinic.city
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(clinic.address ? { streetAddress: clinic.address } : {}),
            ...(clinic.city ? { addressLocality: clinic.city } : {}),
            addressCountry: 'AZ',
          },
        }
      : {}),
    ...(clinic.latitude != null && clinic.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: clinic.latitude, longitude: clinic.longitude } }
      : {}),
    ...(hasHours
      ? {
          openingHoursSpecification: WEEKDAY_KEYS.filter(k => hours[k]).map(k => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: WEEKDAY_SCHEMA_ORG[k],
            opens: hours[k]!.open,
            closes: hours[k]!.close,
          })),
        }
      : {}),
  }

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Örtük */}
      <div className="relative h-52 sm:h-72 bg-gradient-to-br from-primary/20 to-accent/15">
        {clinic.coverPhotoUrl && (
          <img src={clinic.coverPhotoUrl} alt={clinic.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        <Link href="/klinikalar"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-bold bg-card/90 backdrop-blur px-3 py-2 rounded-xl border border-border text-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Bütün klinikalar
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 lg:pb-10">
        {/* Başlıq bloku */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-card border-2 border-border overflow-hidden flex items-center justify-center shadow-premium shrink-0">
            {clinic.logoUrl
              ? <img src={clinic.logoUrl} alt="" className="w-full h-full object-cover" />
              : <Building2 className="w-10 h-10 text-primary/50" />}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">{clinic.name}</h1>
              <Badge tone="success"><ShieldCheck className="w-3 h-3" /> Təsdiqlənmiş tərəfdaş</Badge>
              {clinic.isVetKlinikaTenant && <Badge tone="primary"><Sparkles className="w-3 h-3" /> 24/7 AI randevu</Badge>}
            </div>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              {[clinic.city, clinic.district, clinic.address].filter(Boolean).join(', ') || 'Azərbaycan'}
            </p>
            {hasHours && (
              <p className={`text-xs font-extrabold mt-1.5 flex items-center gap-1.5 ${status.isOpen ? 'text-success' : 'text-destructive'}`}>
                <Clock className="w-3.5 h-3.5" />
                {status.isOpen ? 'İndi açıqdır' : 'Hazırda bağlıdır'}
                {status.todayLabel && status.todayLabel !== 'Bağlıdır' && ` · bu gün ${status.todayLabel}`}
              </p>
            )}
          </div>

          {/* Desktop əlaqə düymələri */}
          <div className="hidden lg:flex items-center gap-2 pb-1">
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                className="px-5 py-3 bg-success text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-soft">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {tel && (
              <a href={`tel:${tel}`}
                className="px-5 py-3 bg-secondary text-foreground text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-muted transition-all border border-border">
                <Phone className="w-4 h-4" /> Zəng et
              </a>
            )}
            {directionsUrl && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                className="px-5 py-3 bg-primary-soft text-primary text-sm font-bold rounded-xl flex items-center gap-2 hover:brightness-105 transition-all border border-primary/15">
                <Navigation className="w-4 h-4" /> Yol tarifi
              </a>
            )}
          </div>
        </div>

        {/* AI randevu CTA — SaaS-ın canlı nümayişi */}
        {clinic.isVetKlinikaTenant && wa && (
          <div className="mt-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/25 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-foreground">Bu klinikada 24/7 AI randevu işləyir</p>
                <p className="text-xs text-muted-foreground font-medium">
                  WhatsApp-a yazın — süni intellekt resepşn dərhal cavab verib randevunuzu yazacaq, gecə də, gündüz də.
                </p>
              </div>
            </div>
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent('Salam! Randevu almaq istəyirəm.')}`}
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-primary text-primary-foreground text-sm font-extrabold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-premium shrink-0">
              <MessageCircle className="w-4 h-4" /> Onlayn Randevu Al
            </a>
          </div>
        )}

        {clinic.emergencyAvailable && (
          <p className="mt-4 text-sm font-bold text-destructive flex items-center gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-4 py-3 w-fit">
            <Siren className="w-4 h-4" /> Bu klinikada təcili yardım xidməti mövcuddur
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Sol: təsvir + xidmətlər + həkimlər + qalereya */}
          <div className="lg:col-span-2 space-y-8">
            {clinic.description && (
              <section>
                <h2 className="text-lg font-display font-extrabold mb-3">Klinika haqqında</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">{clinic.description}</p>
              </section>
            )}

            {clinic.services.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-extrabold mb-3">Xidmətlər</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {clinic.services.map(s => (
                    <div key={s} className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> {s}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {priceList.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-extrabold mb-3 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" /> Qiymətlər
                </h2>
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
                  {priceList.map((item, i) => (
                    <div key={i}
                      className={`flex items-center justify-between px-5 py-3.5 text-sm ${i > 0 ? 'border-t border-border' : ''}`}>
                      <span className="font-bold text-foreground">{item.name}</span>
                      <span className="font-extrabold text-primary whitespace-nowrap">{item.price} ₼</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium mt-2">
                  Qiymətlər təxminidir — dəqiq məbləğ müayinədən sonra müəyyənləşir.
                </p>
              </section>
            )}

            {clinic.achievements.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-extrabold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" /> Nailiyyətlər
                </h2>
                <div className="space-y-2.5">
                  {clinic.achievements.map((a, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
                        <Trophy className="w-3.5 h-3.5" />
                      </span>
                      <span className="leading-relaxed">{a}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {clinic.doctors.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-extrabold mb-3">Həkim heyəti</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinic.doctors.map(d => (
                    <div key={d.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-soft">
                      <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden flex items-center justify-center shrink-0 border border-border">
                        {d.photoUrl
                          ? <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
                          : <UserRound className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-foreground truncate">{d.name}</p>
                        {d.title && <p className="text-xs text-primary font-bold truncate">{d.title}</p>}
                        {d.specialties.length > 0 && (
                          <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                            {d.specialties.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {clinic.photos.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-extrabold mb-3">Fotolar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {clinic.photos.map((url, i) => (
                    <img key={i} src={url} alt={`${clinic.name} foto ${i + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-border" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sağ: iş saatları + əlaqə kartı */}
          <div className="space-y-6">
            {hasHours && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <h3 className="font-extrabold text-sm flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-primary" /> İş saatları
                </h3>
                <div className="space-y-2">
                  {WEEKDAY_KEYS.map(k => {
                    const day = hours[k]
                    return (
                      <div key={k} className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">{WEEKDAY_LABELS_AZ[k]}</span>
                        <span className={day ? 'text-foreground' : 'text-destructive'}>
                          {day ? `${day.open} – ${day.close}` : 'Bağlıdır'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> Əlaqə
              </h3>
              {clinic.publicPhone && tel && (
                <a href={`tel:${tel}`} className="block text-sm font-bold text-foreground hover:text-primary transition-colors">
                  {clinic.publicPhone}
                </a>
              )}
              {clinic.address && (
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {[clinic.address, clinic.district, clinic.city].filter(Boolean).join(', ')}
                </p>
              )}
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full py-2.5 bg-primary-soft text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:brightness-105 transition-all border border-primary/15">
                  <Navigation className="w-3.5 h-3.5" /> Google Maps-də yol tarifi
                </a>
              )}
            </div>

            {/* Klinika-sahibi kontrast CTA (yalnız qeyri-PIMS klinikalarda) */}
            {!clinic.isVetKlinikaTenant && (
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-5">
                <p className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" /> Klinika sahibisiniz?
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-2 mb-4">
                  Sizin klinikanızda da 24/7 AI resepşn işləsin — WhatsApp randevularını avtomatik qəbul etsin.
                </p>
                <JoinCta size="sm" label="Ətraflı Öyrən" variant="outline" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil sticky əlaqə paneli — konversiya №2 */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-border px-4 py-3 flex gap-2">
        {tel && (
          <a href={`tel:${tel}`}
            className="flex-1 py-3 bg-secondary text-foreground text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 border border-border">
            <Phone className="w-4 h-4" /> Zəng et
          </a>
        )}
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-3 bg-success text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        )}
        {directionsUrl && (
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-3 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5">
            <Navigation className="w-4 h-4" /> Yol tarifi
          </a>
        )}
      </div>
    </PublicShell>
  )
}
