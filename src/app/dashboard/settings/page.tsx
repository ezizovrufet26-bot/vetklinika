'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, CheckCircle, RefreshCw, XCircle, User, Award, Save, Stethoscope } from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/ui/button'

const inputCls =
  'w-full px-4 py-3 bg-card border border-input rounded-xl text-sm font-bold text-foreground ' +
  'outline-none focus:ring-2 focus:ring-ring/30 transition-all placeholder:text-muted-foreground/60 placeholder:font-medium'

export default function SettingsPage() {
  const [status, setStatus] = useState<string>('loading')
  const [qrKey, setQrKey] = useState(Date.now())
  const [doctorName, setDoctorName] = useState('Dr. Rəşad Əliyev')
  const [doctorTitle, setDoctorTitle] = useState('Növbətçi Baş Həkim')
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('doctorName')
    const savedTitle = localStorage.getItem('doctorTitle')
    if (savedName) setDoctorName(savedName)
    if (savedTitle) setDoctorTitle(savedTitle)

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

  const handleSaveDoctorProfile = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('doctorName', doctorName)
    localStorage.setItem('doctorTitle', doctorTitle)
    window.dispatchEvent(new Event('doctorProfileUpdate'))
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
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
                Panelin sağ yuxarı küncündə və hesabatlarda görünəcək ad və vəzifə
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDoctorProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

            <div className="md:col-span-2 flex items-center justify-between pt-2">
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
