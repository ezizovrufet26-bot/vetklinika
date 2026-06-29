'use client'

import { useState } from 'react'
import { addDiagnosticImage } from '@/app/actions/diagnostics'

interface DiagnosticImage {
  id: string
  type: string
  fileUrl: string
  notes?: string | null
  deviceName?: string | null
  createdAt: Date | string
}

export default function DiagnosticViewer({ images, patientId }: { images: DiagnosticImage[]; patientId?: string }) {
  const [selectedImg, setSelectedImg] = useState<DiagnosticImage | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [type, setType] = useState<'UZI' | 'XRAY' | 'CT'>('UZI')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleManualUpload = async () => {
    if (!patientId || !fileUrl) return
    setLoading(true)
    await addDiagnosticImage({
      patientId,
      type,
      fileUrl,
      notes: notes || 'Həkim tərəfindən əllə yükləndi',
      deviceName: 'Əllə Yüklənmiş Fayl'
    })
    setLoading(false)
    setShowUploadModal(false)
    setFileUrl('')
    setNotes('')
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
          <span>📸</span> Rəqəmsal İmicinq (UZİ & Rentgen)
          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
            {images.length} Fayl
          </span>
        </h3>

        {patientId && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 flex items-center gap-1"
          >
            <span>➕</span> Əllə Yüklə
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-center py-8">
          <span className="text-3xl">📸</span>
          <p className="font-bold text-slate-700 mt-2 text-sm">Hələ aparatlardan rəqəmsal şəkil gəlməyib</p>
          <p className="text-[11px] text-slate-400 mt-1">Mindray UZİ və ya Rentgendən çəkilən şəkillər avtomatik bura düşür.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImg(img)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-900 aspect-video shadow-sm hover:shadow-md transition-all"
            >
              <img src={img.fileUrl} alt={img.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-90 group-hover:opacity-100" />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase">
                {img.type}
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/90 to-transparent text-white">
                <p className="text-[10px] font-bold truncate">{img.deviceName || 'Müasir Aparat'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-indigo-100">
            <h4 className="text-lg font-black text-slate-800 mb-2">➕ Əllə UZİ / Rentgen Faylı Əlavə Et</h4>
            <p className="text-xs text-slate-500 mb-4">Aparat şəbəkəyə bağlı olmadıqda şəkilləri əllə kartotekaya ata bilərsiniz.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Növü Seçin:</label>
                <div className="flex gap-2">
                  {(['UZI', 'XRAY', 'CT'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        type === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Şəkil URL keçidi (və ya Fayl):</label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  placeholder="https://... və ya C:/images/uzi.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Həkim Qeydi:</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Məs: Qaraciyər UZİ müayinəsi aparıldı..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleManualUpload}
                  disabled={loading || !fileUrl}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-40"
                >
                  {loading ? 'Yüklənir...' : 'Kartotekaya Yadda Saxla →'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Ləğv et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer Modal */}
      {selectedImg && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-700 shadow-2xl">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
              <div>
                <span className="px-2.5 py-1 bg-indigo-500 text-white font-black text-xs rounded-lg mr-2 uppercase">
                  {selectedImg.type}
                </span>
                <span className="font-bold text-sm">{selectedImg.deviceName || 'Aparat İnteqrasiyası'}</span>
              </div>
              <button
                onClick={() => setSelectedImg(null)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh]">
              <img src={selectedImg.fileUrl} alt="DICOM Full" className="max-h-[65vh] object-contain rounded-xl shadow-lg" />
            </div>
            {selectedImg.notes && (
              <div className="p-4 bg-slate-800/80 border-t border-slate-700 text-slate-300 text-xs font-medium">
                <strong className="text-white">Aparat / Həkim Qeydi:</strong> {selectedImg.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
