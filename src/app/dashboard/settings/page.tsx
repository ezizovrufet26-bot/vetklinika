'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, CheckCircle, RefreshCw, XCircle, User, Award, Save, Stethoscope, Lock, Image, Key } from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/ui/button'
import { changePassword } from '@/app/actions/auth'

const inputCls =
  'w-full px-4 py-3 bg-card border border-input rounded-xl text-sm font-bold text-foreground ' +
  'outline-none focus:ring-2 focus:ring-ring/30 transition-all placeholder:text-muted-foreground/60 placeholder:font-medium'

export default function SettingsPage() {
  const [status, setStatus] = useState<string>('loading')
  const [qrKey, setQrKey] = useState(Date.now())
  const [doctorName, setDoctorName] = useState('Dr. Rəşad Əliyev')
  const [doctorTitle, setDoctorTitle] = useState('Növbətçi Baş Həkim')
  const [doctorPhoto, setDoctorPhoto] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)

  const [passMessage, setPassMessage] = useState({ success: '', error: '' })
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('doctorName')
    const savedTitle = localStorage.getItem('doctorTitle')
    const savedPhoto = localStorage.getItem('doctorPhoto')
    if (savedName) setDoctorName(savedName)
    if (savedTitle) setDoctorTitle(savedTitle)
    if (savedPhoto) setDoctorPhoto(savedPhoto)

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status?t=' + Date.now())
        if (res.ok) {
          const data = await res.json()
          setStatus(data.status)
          if (data.status === 'waiting_qr') {
            setQrKey(Date.now())
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Limit file size to 1MB
      if (file.size > 1024 * 1024) {
        alert('Şəkil ölçüsü 1MB-dan çox ola bilməz.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setDoctorPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDoctorProfile = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('doctorName', doctorName)
    localStorage.setItem('doctorTitle', doctorTitle)
    if (doctorPhoto) {
      localStorage.setItem('doctorPhoto', doctorPhoto)
    } else {
      localStorage.removeItem('doctorPhoto')
    }
    window.dispatchEvent(new Event('doctorProfileUpdate'))
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPassLoading(true)
    setPassMessage({ success: '', error: '' })
    const formData = new FormData(e.currentTarget)
    const result = await changePassword(null, formData)
    if (result.error) {
      setPassMessage({ success: '', error: result.error })
    } else {
      setPassMessage({ success: result.success || 'Şifrə dəyişdirildi!', error: '' })
      e.currentTarget.reset()
    }
    setPassLoading(false)
  }

  return (
    <AppShell>
      <PageHeader
        title="Sistem və"
        highlight="Profil Ayarları"
        subtitle="Həkim profili və WhatsApp inteqrasiyası"
      />

      <div className="max-w-4xl space-y-6">
        {/* Həkim profili */}
        <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-soft border border-border space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-extrabold">Həkim Profili</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Panelin sağ yuxarı küncündə və hesabatlarda görünəcək ad, vəzifə və şəkil
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDoctorProfile} className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-6 items-center bg-secondary/35 p-5 rounded-2xl border border-border">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-white text-3xl font-black overflow-hidden shadow-md border-2 border-primary/20 shrink-0">
                {doctorPhoto ? (
                  <img src={doctorPhoto} alt="Doctor" className="w-full h-full object-cover" />
                ) : (
                  '👨‍⚕️'
                )}
              </div>
              <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                <label className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Image className="w-4 h-4 text-primary" /> Profil Şəkli
                </label>
                <div className="flex flex-wrap gap-2.5 items-center justify-center sm:justify-start">
                  <input
                    type="file"
                    accept="image/*"
                    id="doctor-photo-upload"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="doctor-photo-upload"
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer hover:brightness-110 shadow-soft transition-all"
                  >
                    Şəkil Seç
                  </label>
                  {doctorPhoto && (
                    <button
                      type="button"
                      onClick={() => setDoctorPhoto(null)}
                      className="px-4 py-2 bg-destructive/10 text-destructive text-xs font-bold rounded-xl hover:bg-destructive/20 transition-all"
                    >
                      Şəkli Sil
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Maksimum ölçü: 1MB. Kvadrat şəkillərə üstünlük verilir.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <User className="w-4 h-4 text-primary" /> Həkimin Adı və Soyadı
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Məs: Dr. Əzizov Rüfət"
                  required
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Award className="w-4 h-4 text-primary" /> Vəzifə və ya İxtisas
                </label>
                <input
                  type="text"
                  value={doctorTitle}
                  onChange={(e) => setDoctorTitle(e.target.value)}
                  placeholder="Məs: Növbətçi Baş Həkim"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedMsg ? (
                <span className="text-xs font-extrabold text-success bg-success/10 border border-success/25 px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Profil uğurla yeniləndi!
                </span>
              ) : (
                <span />
              )}
              <Button type="submit" size="sm">
                <Save className="w-4 h-4" /> Profili Yadda Saxla
              </Button>
            </div>
          </form>
        </div>

        {/* Şifrənin Dəyişdirilməsi */}
        <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-soft border border-border space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-extrabold">Şifrəni Dəyişdir</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Giriş təhlükəsizliyi üçün şifrənizi mütəmadi olaraq yeniləyin
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passMessage.error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-bold rounded-xl border border-destructive/25 flex items-center gap-2">
                <XCircle className="w-4.5 h-4.5" /> {passMessage.error}
              </div>
            )}
            {passMessage.success && (
              <div className="p-4 bg-success/10 text-success text-sm font-bold rounded-xl border border-success/25 flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5" /> {passMessage.success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary" /> Cari Şifrə
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary" /> Yeni Şifrə
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary" /> Yeni Şifrə (Təkrar)
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" disabled={passLoading}>
                {passLoading ? 'Yenilənir...' : 'Şifrəni Yenilə'}
              </Button>
            </div>
          </form>
        </div>

        {/* WhatsApp inteqrasiyası */}
        <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-soft border border-border flex flex-col md:flex-row gap-8">
          {/* Sol: Məlumat */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-lg font-display font-extrabold flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
                  <Smartphone className="w-4.5 h-4.5" />
                </span>
                WhatsApp İnteqrasiyası
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Klinikanızın rəsmi WhatsApp nömrəsini sistemə bağlayaraq müştərilərlə AI dəstəkli
                avtomatik canlı çat əlaqəsi qura bilərsiniz.
              </p>
            </div>

            <div className="bg-secondary/50 p-5 rounded-xl border border-border">
              <h3 className="text-xs font-extrabold text-muted-foreground mb-3 uppercase tracking-wider">Cari Status</h3>

              {status === 'loading' && (
                <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Yoxlanılır...
                </div>
              )}

              {status === 'connected' && (
                <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 border border-success/25 w-fit px-4 py-2 rounded-xl">
                  <CheckCircle className="w-4.5 h-4.5" /> Nömrə Bağlıdır (Aktivdir)
                </div>
              )}

              {status === 'waiting_qr' && (
                <div className="flex items-center gap-2 text-warning font-bold text-sm bg-warning/10 border border-warning/25 w-fit px-4 py-2 rounded-xl">
                  <QrCode className="w-4.5 h-4.5" /> QR Kod Oxudulması Gözlənilir
                </div>
              )}

              {status === 'disconnected' && (
                <div className="flex items-center gap-2 text-destructive font-bold text-sm bg-destructive/10 border border-destructive/25 w-fit px-4 py-2 rounded-xl">
                  <XCircle className="w-4.5 h-4.5" /> Bağlantı Kəsilib
                </div>
              )}
            </div>

            <ul className="text-sm text-muted-foreground font-medium space-y-2 list-disc pl-5">
              <li>WhatsApp-a daxil olun.</li>
              <li><strong className="text-foreground">Bağlı Cihazlar</strong> (Linked Devices) bölməsinə keçin.</li>
              <li><strong className="text-foreground">Cihaz Bağla</strong> (Link a Device) seçib, ekrandakı QR kodu skan edin.</li>
            </ul>
          </div>

          {/* Sağ: QR kod */}
          <div className="w-full md:w-72 flex flex-col items-center justify-center bg-secondary/50 p-6 rounded-2xl border border-border">
            {status === 'connected' ? (
              <div className="text-center">
                <div className="w-28 h-28 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-14 h-14 text-success" />
                </div>
                <p className="font-extrabold text-success">Təbriklər!</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Sistem tam aktivdir və mesajları qəbul edir.
                </p>
              </div>
            ) : status === 'waiting_qr' ? (
              <div className="text-center">
                <div className="bg-white p-2 rounded-2xl shadow-soft mb-4 inline-block">
                  <img src={`/qr.png?t=${qrKey}`} alt="WhatsApp QR Code" className="w-48 h-48 rounded-xl object-contain" />
                </div>
                <p className="text-xs font-bold text-warning">Skan edin</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <QrCode className="w-14 h-14 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">QR Kod yüklənir və ya sistem sönülüdür...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
