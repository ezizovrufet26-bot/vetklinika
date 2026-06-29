'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, CheckCircle, RefreshCw, XCircle, User, Award } from 'lucide-react'

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
        const res = await fetch('/whatsapp-status.json?t=' + Date.now())
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
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <h1 className="text-3xl font-black text-slate-800">⚙️ Sistem Və Profil Ayarları</h1>

      {/* Doctor Profile Settings Card */}
      <div className="bg-gradient-to-br from-white to-emerald-50/40 p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/20">
            👨‍⚕️
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Həkim Profili Və Daxilolma Ayarları</h2>
            <p className="text-xs text-slate-500">Ekranın sağ yuxarı küncündə və hesabatlarda görünəcək Ad, Soyad və Vəzifənizi tənzimləyin</p>
          </div>
        </div>

        <form onSubmit={handleSaveDoctorProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <User className="w-4 h-4 text-emerald-600" /> Həkimin Adı Və Soyadı
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Məs: Dr. Əzizov Rüfət"
              required
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Award className="w-4 h-4 text-emerald-600" /> Vəzifə Və Ya İxtisas
            </label>
            <input
              type="text"
              value={doctorTitle}
              onChange={(e) => setDoctorTitle(e.target.value)}
              placeholder="Məs: Növbətçi Baş Həkim"
              required
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            {savedMsg ? (
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-4 py-2.5 rounded-xl animate-fade-in flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Həkim Profili Uğurla Yeniləndi Və Yadda Saxlanıldı!
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              💾 Profili Yadda Saxla
            </button>
          </div>
        </form>
      </div>

      {/* WhatsApp Integration Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
        
        {/* Left Side: Info */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Smartphone className="text-emerald-500" />
              WhatsApp İnteqrasiyası
            </h2>
            <p className="text-sm text-slate-500">
              Klinikanızın rəsmi WhatsApp nömrəsini sistemə bağlayaraq müştərilərlə AI dəstəkli və avtomatik canlı çat əlaqəsi qura bilərsiniz.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Cari Status</h3>
            
            {status === 'loading' && (
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <RefreshCw className="w-5 h-5 animate-spin" /> Yoxlanılır...
              </div>
            )}
            
            {status === 'connected' && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 w-fit px-4 py-2 rounded-xl">
                <CheckCircle className="w-5 h-5" /> Nömrə Bağlıdır (Aktivdir)
              </div>
            )}
            
            {status === 'waiting_qr' && (
              <div className="flex items-center gap-2 text-amber-600 font-bold bg-amber-50 w-fit px-4 py-2 rounded-xl">
                <QrCode className="w-5 h-5" /> QR Kod Oxudulması Gözlənilir
              </div>
            )}

            {status === 'disconnected' && (
              <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 w-fit px-4 py-2 rounded-xl">
                <XCircle className="w-5 h-5" /> Bağlantı Kəsilib
              </div>
            )}
          </div>
          
          <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
            <li>WhatsApp-a daxil olun.</li>
            <li><strong>Bağlı Cihazlar</strong> (Linked Devices) bölməsinə keçin.</li>
            <li><strong>Cihaz Bağla</strong> (Link a Device) seçib, ekrandakı QR kodu skan edin.</li>
          </ul>
        </div>

        {/* Right Side: QR Code */}
        <div className="w-full md:w-72 flex flex-col items-center justify-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
          {status === 'connected' ? (
            <div className="text-center">
              <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="font-bold text-emerald-700">Təbriklər!</p>
              <p className="text-xs text-emerald-600 mt-1">Sistem tam aktivdir və mesajları qəbul edir.</p>
            </div>
          ) : status === 'waiting_qr' ? (
            <div className="text-center">
              <div className="bg-white p-2 rounded-2xl shadow-sm mb-4 inline-block">
                <img src={`/qr.png?t=${qrKey}`} alt="WhatsApp QR Code" className="w-48 h-48 rounded-xl object-contain" />
              </div>
              <p className="text-xs font-bold text-amber-600">Skan edin</p>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <QrCode className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-sm">QR Kod Yüklənir və ya Sistem Sönülüdür...</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
