'use client'

import { useState } from 'react'
import { CheckCircle, Clock, User, Building2, Phone, Sparkles, X } from 'lucide-react'

export interface AccessRequest {
  id: string
  doctorName: string
  clinicName: string
  phone: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface RegisterRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RegisterRequestModal({ isOpen, onClose }: RegisterRequestModalProps) {
  const [doctorName, setDoctorName] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [submittedRequest, setSubmittedRequest] = useState<AccessRequest | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorName || !clinicName || !phone) return

    const newReq: AccessRequest = {
      id: 'req-' + Date.now(),
      doctorName: doctorName.trim(),
      clinicName: clinicName.trim(),
      phone: phone.trim(),
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
    }

    const existingJson = localStorage.getItem('vet_access_requests')
    const list: AccessRequest[] = existingJson ? JSON.parse(existingJson) : []
    list.unshift(newReq)
    localStorage.setItem('vet_access_requests', JSON.stringify(list))

    // Notify listeners
    window.dispatchEvent(new Event('accessRequestsUpdate'))

    setSubmittedRequest(newReq)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedRequest ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Müraciətiniz Qeydə Alındı! ⏳</h3>
              <p className="text-xs font-bold text-slate-600 leading-relaxed max-w-xs mx-auto">
                Hörmətli <span className="text-emerald-700">{submittedRequest.doctorName}</span>, müştəri qeydiyyatınız sistemə düşdü.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60 text-left text-xs space-y-1.5 font-bold text-amber-900">
              <p className="flex items-center gap-2 text-amber-700">
                <Sparkles className="w-4 h-4" /> <strong>SuperAdmin Təsdiqi Gözlənilir:</strong>
              </p>
              <p className="text-[11px] text-amber-800 font-medium">
                Yaradıcı Və Baş Admin (Siz) paneldə <strong>"OK (Təsdiqlə)"</strong> düyməsini sıxan kimi girişiniz anında aktivləşəcək!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-lg transition-all"
            >
              Tamam, Anladım
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                📝
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Müştəri Qeydiyyatı</h3>
                <p className="text-xs text-slate-500 font-medium">Sistemə daxil olmaq üçün məlumatlarınızı daxil edin</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Həkimin Adı Soyadı
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Məs: Dr. Natiq Qasımov"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Klinikanın Adı
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Məs: Arzu Vet Kliniyi"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Telefon / WhatsApp Nömrəsi
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Məs: +994 50 123 45 67"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 mt-2"
              >
                📥 Qeydiyyatdan Keç Və Təsdiqə Göndər
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
