'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, CheckCircle, RefreshCw, XCircle } from 'lucide-react'

export default function SettingsPage() {
  const [status, setStatus] = useState<string>('loading')
  const [qrKey, setQrKey] = useState(Date.now())

  useEffect(() => {
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

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-black text-slate-800 mb-8">⚙️ Sistem Ayarları</h1>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10">
        
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
                {/* Add timestamp query param to force reload the image if it changes */}
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
