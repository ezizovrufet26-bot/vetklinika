'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, X,
  CheckCircle, XCircle, UserRound, Sparkles,
} from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import {
  savePartner, togglePartnerPublished, deletePartner, saveDoctor, deleteDoctor,
} from '@/app/actions/partners'
import {
  WEEKDAY_KEYS, WEEKDAY_LABELS_AZ, parsePriceList,
  type WorkingHours, type WeekdayKey, type PriceItem,
} from '@/lib/directory'

const inputCls =
  'w-full px-4 py-3 bg-card border border-input rounded-xl text-sm font-bold text-foreground ' +
  'outline-none focus:ring-2 focus:ring-ring/30 transition-all placeholder:text-muted-foreground/60 placeholder:font-medium'

type Doctor = {
  id: string; name: string; title: string | null; photoUrl: string | null
  bio: string | null; specialties: string[]; displayOrder: number
}
type Clinic = {
  id: string; name: string; slug: string | null; isPublished: boolean
  city: string | null; district: string | null; address: string | null
  description: string | null; logoUrl: string | null; coverPhotoUrl: string | null
  publicPhone: string | null; whatsappNumber: string | null; googlePlaceUrl: string | null
  services: string[]; latitude: number | null; longitude: number | null
  workingHours: unknown; isVetKlinikaTenant: boolean; emergencyAvailable: boolean
  displayOrder: number; priceList: unknown; achievements: string[]
  doctors: Doctor[]; _count: { users: number }
}

const DEFAULT_HOURS: WorkingHours = {
  mon: { open: '09:00', close: '19:00' }, tue: { open: '09:00', close: '19:00' },
  wed: { open: '09:00', close: '19:00' }, thu: { open: '09:00', close: '19:00' },
  fri: { open: '09:00', close: '19:00' }, sat: { open: '10:00', close: '16:00' },
  sun: null,
}

function HoursEditor({ value, onChange }: { value: WorkingHours; onChange: (h: WorkingHours) => void }) {
  return (
    <div className="space-y-2">
      {WEEKDAY_KEYS.map((key: WeekdayKey) => {
        const day = value[key] ?? null
        return (
          <div key={key} className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 w-36 font-bold text-muted-foreground">
              <input
                type="checkbox"
                checked={day !== null}
                onChange={(e) =>
                  onChange({ ...value, [key]: e.target.checked ? { open: '09:00', close: '19:00' } : null })
                }
              />
              {WEEKDAY_LABELS_AZ[key]}
            </label>
            {day ? (
              <>
                <input type="time" value={day.open}
                  onChange={(e) => onChange({ ...value, [key]: { ...day, open: e.target.value } })}
                  className="px-2 py-1.5 bg-card border border-input rounded-lg font-bold" />
                <span className="text-muted-foreground">–</span>
                <input type="time" value={day.close}
                  onChange={(e) => onChange({ ...value, [key]: { ...day, close: e.target.value } })}
                  className="px-2 py-1.5 bg-card border border-input rounded-lg font-bold" />
              </>
            ) : (
              <span className="text-muted-foreground font-medium">Bağlıdır</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PriceListEditor({ value, onChange }: { value: PriceItem[]; onChange: (v: PriceItem[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item.name}
            onChange={(e) => onChange(value.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)))}
            placeholder="Xidmət adı (məs: Peyvənd)"
            className="flex-1 px-3 py-2 bg-card border border-input rounded-lg text-xs font-bold outline-none focus:border-primary"
          />
          <input
            type="number" step="0.01" min="0"
            value={Number.isFinite(item.price) ? item.price : ''}
            onChange={(e) => onChange(value.map((it, j) => (j === i ? { ...it, price: parseFloat(e.target.value) || 0 } : it)))}
            placeholder="₼"
            className="w-24 px-3 py-2 bg-card border border-input rounded-lg text-xs font-bold outline-none focus:border-primary"
          />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: '', price: 0 }])}
        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:brightness-110 transition-all">
        <Plus className="w-3.5 h-3.5" /> Qiymət sətri əlavə et
      </button>
    </div>
  )
}

function ClinicForm({ clinic, onDone }: { clinic: Clinic | null; onDone: () => void }) {
  const router = useRouter()
  const [msg, setMsg] = useState({ success: '', error: '' })
  const [loading, setLoading] = useState(false)
  const [hours, setHours] = useState<WorkingHours>(
    clinic?.workingHours && typeof clinic.workingHours === 'object'
      ? (clinic.workingHours as WorkingHours)
      : DEFAULT_HOURS
  )
  const [prices, setPrices] = useState<PriceItem[]>(parsePriceList(clinic?.priceList))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMsg({ success: '', error: '' })
    const formData = new FormData(e.currentTarget)
    formData.set('workingHours', JSON.stringify(hours))
    formData.set('priceList', JSON.stringify(prices.filter(p => p.name.trim())))
    const result = await savePartner(null, formData)
    if (result.error) {
      setMsg({ success: '', error: result.error })
    } else {
      setMsg({ success: result.success || 'Yadda saxlanıldı', error: '' })
      router.refresh()
      setTimeout(onDone, 700)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {clinic && <input type="hidden" name="id" value={clinic.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Klinika adı *</label>
          <input name="name" required defaultValue={clinic?.name || ''} placeholder="Məs: Dost Baytarlıq Klinikası" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Şəhər</label>
            <input name="city" defaultValue={clinic?.city || ''} placeholder="Bakı" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rayon</label>
            <input name="district" defaultValue={clinic?.district || ''} placeholder="Nərimanov" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ünvan</label>
        <input name="address" defaultValue={clinic?.address || ''} placeholder="Küçə, bina..." className={inputCls} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Təsvir (kataloq profilində görünür)</label>
        <textarea name="description" defaultValue={clinic?.description || ''} rows={3}
          placeholder="Klinika haqqında qısa, satış yönümlü mətn..." className={inputCls} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefon</label>
          <input name="publicPhone" defaultValue={clinic?.publicPhone || ''} placeholder="+994 XX XXX XX XX" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp nömrəsi</label>
          <input name="whatsappNumber" defaultValue={clinic?.whatsappNumber || ''} placeholder="+994501234567" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sıra (kiçik = yuxarı)</label>
          <input name="displayOrder" type="number" defaultValue={clinic?.displayOrder ?? 0} className={inputCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Xidmətlər (vergüllə)</label>
        <input name="services" defaultValue={(clinic?.services || []).join(', ')}
          placeholder="Peyvənd, Cərrahiyyə, Rentgen, UZİ, Laboratoriya" className={inputCls} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enlik (lat)</label>
          <input name="latitude" inputMode="decimal" defaultValue={clinic?.latitude?.toString() || ''} placeholder="40.4093" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uzunluq (lng)</label>
          <input name="longitude" inputMode="decimal" defaultValue={clinic?.longitude?.toString() || ''} placeholder="49.8671" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Google Maps linki</label>
          <input name="googlePlaceUrl" defaultValue={clinic?.googlePlaceUrl || ''} placeholder="https://maps.app.goo.gl/..." className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loqo (kvadrat)</label>
          <input name="logo" type="file" accept="image/*" className={inputCls} />
          {clinic?.logoUrl && <p className="text-[10px] text-muted-foreground">Mövcud loqo var — yeni seçsəniz əvəzlənəcək</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Örtük fotosu (geniş)</label>
          <input name="cover" type="file" accept="image/*" className={inputCls} />
          {clinic?.coverPhotoUrl && <p className="text-[10px] text-muted-foreground">Mövcud örtük var — yeni seçsəniz əvəzlənəcək</p>}
        </div>
      </div>

      <div className="bg-secondary/35 border border-border rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">İş saatları</p>
        <HoursEditor value={hours} onChange={setHours} />
      </div>

      <div className="bg-secondary/35 border border-border rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Qiymət cədvəli (profildə görünür)</p>
        <PriceListEditor value={prices} onChange={setPrices} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Nailiyyətlər (hər sətir ayrıca göstərilir)
        </label>
        <textarea name="achievements" defaultValue={(clinic?.achievements || []).join('\n')} rows={3}
          placeholder={'10 ildən artıq təcrübə\n5000+ uğurlu müalicə\nBeynəlxalq sertifikatlı həkimlər'} className={inputCls} />
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-bold text-foreground">
          <input type="checkbox" name="emergencyAvailable" defaultChecked={clinic?.emergencyAvailable} />
          Təcili yardım var
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-foreground">
          <input type="checkbox" name="isVetKlinikaTenant" defaultChecked={clinic?.isVetKlinikaTenant} />
          VetKlinika istifadəçisidir (24/7 AI randevu nişanı)
        </label>
      </div>

      {msg.error && (
        <p className="text-xs font-extrabold text-destructive bg-destructive/10 border border-destructive/25 px-4 py-2.5 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4" /> {msg.error}
        </p>
      )}
      {msg.success && (
        <p className="text-xs font-extrabold text-success bg-success/10 border border-success/25 px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {msg.success}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Bağla</Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saxlanılır...' : 'Yadda Saxla'}
        </Button>
      </div>
    </form>
  )
}

function DoctorForm({ clinicId, doctor, onDone }: { clinicId: string; doctor: Doctor | null; onDone: () => void }) {
  const router = useRouter()
  const [msg, setMsg] = useState({ success: '', error: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMsg({ success: '', error: '' })
    const result = await saveDoctor(null, new FormData(e.currentTarget))
    if (result.error) {
      setMsg({ success: '', error: result.error })
    } else {
      router.refresh()
      setTimeout(onDone, 500)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-secondary/35 border border-border rounded-2xl p-4">
      <input type="hidden" name="clinicId" value={clinicId} />
      {doctor && <input type="hidden" name="id" value={doctor.id} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="name" required defaultValue={doctor?.name || ''} placeholder="Həkimin adı *" className={inputCls} />
        <input name="title" defaultValue={doctor?.title || ''} placeholder="Titul (Baş həkim...)" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="specialties" defaultValue={(doctor?.specialties || []).join(', ')} placeholder="İxtisaslar (vergüllə)" className={inputCls} />
        <input name="photo" type="file" accept="image/*" className={inputCls} />
      </div>
      <textarea name="bio" defaultValue={doctor?.bio || ''} rows={2} placeholder="Qısa bio (istəyə görə)" className={inputCls} />
      {msg.error && <p className="text-xs font-bold text-destructive">{msg.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Ləğv et</Button>
        <Button type="submit" size="sm" disabled={loading}>{loading ? '...' : 'Saxla'}</Button>
      </div>
    </form>
  )
}

export default function PartnersClient({ initialClinics }: { initialClinics: Clinic[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [doctorFormFor, setDoctorFormFor] = useState<{ clinicId: string; doctor: Doctor | null } | null>(null)
  const [actionMsg, setActionMsg] = useState('')

  const handleToggle = async (id: string) => {
    const result = await togglePartnerPublished(id)
    setActionMsg(result.error || result.success || '')
    router.refresh()
    setTimeout(() => setActionMsg(''), 3000)
  }

  const handleDelete = async (clinic: Clinic) => {
    if (!window.confirm(`"${clinic.name}" kataloqdan tamamilə silinsin? Bu geri qaytarıla bilməz.`)) return
    const result = await deletePartner(clinic.id)
    setActionMsg(result.error || result.success || '')
    router.refresh()
    setTimeout(() => setActionMsg(''), 4000)
  }

  const handleDeleteDoctor = async (d: Doctor) => {
    if (!window.confirm(`Həkim "${d.name}" silinsin?`)) return
    await deleteDoctor(d.id)
    router.refresh()
  }

  return (
    <AppShell>
      <PageHeader
        title="Tərəfdaş"
        highlight="Klinikalar"
        subtitle="İctimai kataloqda (/klinikalar) görünən klinikaların idarəsi"
        actions={
          <Button size="sm" onClick={() => { setCreating(true); setEditingId(null) }}>
            <Plus className="w-4 h-4" /> Yeni Klinika
          </Button>
        }
      />

      {actionMsg && (
        <p className="mb-4 text-xs font-extrabold text-primary bg-primary-soft border border-primary/20 px-4 py-2.5 rounded-xl w-fit">
          {actionMsg}
        </p>
      )}

      {creating && (
        <div className="bg-card border border-border rounded-2xl shadow-soft p-6 mb-6">
          <h2 className="text-lg font-display font-extrabold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Yeni Tərəfdaş Klinika
          </h2>
          <ClinicForm clinic={null} onDone={() => setCreating(false)} />
        </div>
      )}

      <div className="space-y-4">
        {initialClinics.length === 0 && !creating && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-bold">Hələ tərəfdaş klinika yoxdur — "Yeni Klinika" ilə başlayın</p>
          </div>
        )}

        {initialClinics.map(clinic => (
          <div key={clinic.id} className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
            <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
                {clinic.logoUrl
                  ? <img src={clinic.logoUrl} alt={clinic.name} className="w-full h-full object-cover" />
                  : <Building2 className="w-5 h-5 text-muted-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-foreground">{clinic.name}</h3>
                  {clinic.isPublished
                    ? <Badge tone="success">Dərc olunub</Badge>
                    : <Badge tone="neutral">Qaralama</Badge>}
                  {clinic.isVetKlinikaTenant && (
                    <Badge tone="primary"><Sparkles className="w-3 h-3" /> AI aktiv</Badge>
                  )}
                  {clinic._count.users > 0 && <Badge tone="info">PIMS hesabları: {clinic._count.users}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {[clinic.city, clinic.district, clinic.address].filter(Boolean).join(', ') || 'Ünvan qeyd olunmayıb'}
                  {' · '}<UserRound className="w-3 h-3 inline" /> {clinic.doctors.length} həkim
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {clinic.slug && clinic.isPublished && (
                  <Link href={`/klinikalar/${clinic.slug}`} target="_blank"
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" title="İctimai səhifəyə bax">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button onClick={() => handleToggle(clinic.id)}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                  title={clinic.isPublished ? 'Gizlət' : 'Dərc et'}>
                  {clinic.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditingId(editingId === clinic.id ? null : clinic.id); setCreating(false) }}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" title="Redaktə">
                  {editingId === clinic.id ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
                {clinic._count.users === 0 && (
                  <button onClick={() => handleDelete(clinic)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {editingId === clinic.id && (
              <div className="border-t border-border p-5 space-y-6">
                <ClinicForm clinic={clinic} onDone={() => setEditingId(null)} />

                <div className="border-t border-border pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <UserRound className="w-4 h-4 text-primary" /> Həkim heyəti ({clinic.doctors.length})
                    </h4>
                    <Button variant="outline" size="sm"
                      onClick={() => setDoctorFormFor({ clinicId: clinic.id, doctor: null })}>
                      <Plus className="w-3.5 h-3.5" /> Həkim əlavə et
                    </Button>
                  </div>

                  {doctorFormFor?.clinicId === clinic.id && (
                    <div className="mb-4">
                      <DoctorForm clinicId={clinic.id} doctor={doctorFormFor.doctor} onDone={() => setDoctorFormFor(null)} />
                    </div>
                  )}

                  <div className="space-y-2">
                    {clinic.doctors.map(d => (
                      <div key={d.id} className="flex items-center gap-3 bg-secondary/35 border border-border rounded-xl px-4 py-2.5">
                        <div className="w-9 h-9 rounded-lg bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                          {d.photoUrl
                            ? <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
                            : <UserRound className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{d.name}</p>
                          {d.title && <p className="text-[11px] text-muted-foreground truncate">{d.title}</p>}
                        </div>
                        <button onClick={() => setDoctorFormFor({ clinicId: clinic.id, doctor: d })}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteDoctor(d)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  )
}
