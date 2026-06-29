'use client'

import { useState } from 'react'
import { addDiagnosticImage, addLabResult } from '@/app/actions/diagnostics'

export default function DeviceIntegrationSimulator({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSimulateUzi = async () => {
    setLoading(true)
    setMsg('📡 Mindray Vetus 8 UZİ Aparatı İlə Bağlantı Qurulur...')

    // Sample medical ultrasound image URL
    const uziImages = [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ]
    const randomImg = uziImages[Math.floor(Math.random() * uziImages.length)]

    await addDiagnosticImage({
      patientId,
      type: 'UZI',
      fileUrl: randomImg,
      deviceName: 'Mindray Vetus 8 (Ultrasound)',
      notes: 'Böyrəklər və qarın boşluğu UZİ muayinəsi: Struktur normaldır.'
    })

    setLoading(false)
    setMsg('✅ UZİ Şəkli Avtomatik Xəstənin Qovluğuna İnteqrasiya Olundu!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleSimulateXray = async () => {
    setLoading(true)
    setMsg('📡 IDEXX ImageVue DR30 Rentgen Aparatından Məlumat Çəkilir...')

    await addDiagnosticImage({
      patientId,
      type: 'XRAY',
      fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      deviceName: 'IDEXX ImageVue DR30 (Rəqəmsal Rentgen)',
      notes: 'Döş qəfəsi və oynaqların rəqəmsal rentgen görüntüsü.'
    })

    setLoading(false)
    setMsg('✅ Rentgen Şəkli DICOM Protokolu İlə İnteqrasiya Olundu!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleSimulateBlood = async () => {
    setLoading(true)
    setMsg('📡 Zoetis Vetscan HM5 Aparatından Qan Analizi Qəbul Edilir...')

    const sampleData = [
      { param: 'RBC (Qırmızı qan kürəcikləri)', value: '7.2', unit: 'M/µL', min: '5.5', max: '8.5', status: 'NORMAL' },
      { param: 'WBC (Ağ qan kürəcikləri)', value: '18.5', unit: 'K/µL', min: '6.0', max: '17.0', status: 'HIGH' },
      { param: 'HGB (Hemoqlobin)', value: '14.1', unit: 'g/dL', min: '12.0', max: '18.0', status: 'NORMAL' },
      { param: 'PLT (Trombositlər)', value: '190', unit: 'K/µL', min: '200', max: '500', status: 'LOW' }
    ]

    await addLabResult({
      patientId,
      deviceName: 'Zoetis Vetscan HM5 (Hematologiya)',
      testType: 'HEMATOLOGY',
      dataJson: JSON.stringify(sampleData)
    })

    setLoading(false)
    setMsg('✅ Qan Analizi Nəticələri HL7 Protokolu İlə Qovluğa Yazıldı!')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-indigo-800">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-base font-black flex items-center gap-2">
            <span>🔌</span> Aparat İnteqrasiya Simulyatoru (Hardware Test)
          </h4>
          <p className="text-xs text-indigo-200 mt-0.5">Mindray UZİ, IDEXX Rentgen və Zoetis qan analizatorlarını real vaxtda test edin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <button
          onClick={handleSimulateUzi}
          disabled={loading}
          className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>📡</span> Mindray UZİ Göndər
        </button>
        <button
          onClick={handleSimulateXray}
          disabled={loading}
          className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>📸</span> IDEXX Rentgen Göndər
        </button>
        <button
          onClick={handleSimulateBlood}
          disabled={loading}
          className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>🩸</span> Zoetis Qan Analizi Göndər
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
