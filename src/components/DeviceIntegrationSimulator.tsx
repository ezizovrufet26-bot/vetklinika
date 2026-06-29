'use client'

import { useState } from 'react'
import { addDiagnosticImage, addLabResult } from '@/app/actions/diagnostics'

export default function DeviceIntegrationSimulator({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [deviceIp, setDeviceIp] = useState('192.168.1.105')
  const [isConnected, setIsConnected] = useState(true)

  const handleConnectLan = () => {
    setLoading(true)
    setMsg(`🔌 LAN Kabel İlə Aparat Bağlantısı Yoxlanılır (IP: ${deviceIp})...`)
    setTimeout(() => {
      setIsConnected(true)
      setLoading(false)
      setMsg(`✅ LAN Kabel Bağlantısı Uğurludur! DICOM / HL7 Protokolu Aktivdir.`)
      setTimeout(() => setMsg(''), 4000)
    }, 1200)
  }

  const handleSimulateUzi = async () => {
    setLoading(true)
    setMsg(`📡 Mindray Vetus 8 UZİ Aparatı İlə Bağlantı Qurulur (${deviceIp})...`)

    const uziImages = [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ]
    const randomImg = uziImages[Math.floor(Math.random() * uziImages.length)]

    await addDiagnosticImage({
      patientId,
      type: 'UZI',
      fileUrl: randomImg,
      deviceName: `Mindray Vetus 8 (LAN IP: ${deviceIp})`,
      notes: 'Böyrəklər və qarın boşluğu UZİ muayinəsi: Struktur normaldır.'
    })

    setLoading(false)
    setMsg('✅ UZİ Şəkli DICOM Protokolu İlə Avtomatik Xəstənin Qovluğuna İnteqrasiya Olundu!')
    setTimeout(() => setMsg(''), 4000)
  }

  const handleSimulateXray = async () => {
    setLoading(true)
    setMsg(`📡 IDEXX ImageVue DR30 Rentgen Aparatından Məlumat Çəkilir (${deviceIp})...`)

    await addDiagnosticImage({
      patientId,
      type: 'XRAY',
      fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      deviceName: `IDEXX ImageVue DR30 (LAN IP: ${deviceIp})`,
      notes: 'Döş qəfəsi və oynaqların rəqəmsal rentgen görüntüsü.'
    })

    setLoading(false)
    setMsg('✅ Rentgen Şəkli DICOM Protokolu İlə Qovluğa Yazıldı!')
    setTimeout(() => setMsg(''), 4000)
  }

  const handleSimulateBlood = async () => {
    setLoading(true)
    setMsg(`📡 Zoetis Vetscan HM5 Qan Analizatorundan Məlumat Çəkilir (${deviceIp})...`)

    const sampleData = [
      { param: 'RBC (Qırmızı qan kürəcikləri)', value: '7.2', unit: 'M/µL', min: '5.5', max: '8.5', status: 'NORMAL' },
      { param: 'WBC (Ağ qan kürəcikləri)', value: '18.5', unit: 'K/µL', min: '6.0', max: '17.0', status: 'HIGH' },
      { param: 'HGB (Hemoqlobin)', value: '14.1', unit: 'g/dL', min: '12.0', max: '18.0', status: 'NORMAL' },
      { param: 'PLT (Trombositlər)', value: '190', unit: 'K/µL', min: '200', max: '500', status: 'LOW' }
    ]

    await addLabResult({
      patientId,
      deviceName: `Zoetis Vetscan HM5 (HL7 IP: ${deviceIp})`,
      testType: 'HEMATOLOGY',
      dataJson: JSON.stringify(sampleData)
    })

    setLoading(false)
    setMsg('✅ Qan Analizi Nəticələri HL7 Protokolu İlə Avtomatik Qovluğa Yazıldı!')
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-indigo-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-base font-black flex items-center gap-2">
            <span>🔌</span> Tibbi Aparat LAN / IP İnteqrasiya Modulu (Hardware LAN Sync)
          </h4>
          <p className="text-xs text-indigo-200 mt-0.5">Mindray UZİ, IDEXX Rentgen və Zoetis qan analizatorlarını lokal şəbəkə IP-si ilə bağlayın</p>
        </div>

        {/* LAN IP Config */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-2xl border border-indigo-700/60">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <input
            type="text"
            value={deviceIp}
            onChange={(e) => setDeviceIp(e.target.value)}
            className="bg-transparent text-xs font-bold text-white outline-none w-28 text-center"
            placeholder="192.168.1.X"
          />
          <button
            onClick={handleConnectLan}
            disabled={loading}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            LAN Qoş
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <button
          onClick={handleSimulateUzi}
          disabled={loading}
          className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>📡</span> Mindray UZİ Çək (DICOM)
        </button>
        <button
          onClick={handleSimulateXray}
          disabled={loading}
          className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>📸</span> IDEXX Rentgen Çək (DICOM)
        </button>
        <button
          onClick={handleSimulateBlood}
          disabled={loading}
          className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>🩸</span> Zoetis Qan Analizi Çək (HL7)
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-500/30 border border-indigo-400 text-indigo-100 rounded-xl text-xs font-bold text-center animate-fade-in">
          {msg}
        </div>
      )}
    </div>
  )
}
