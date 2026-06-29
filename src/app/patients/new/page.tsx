'use client'

import { useState } from 'react'
import { createPatient } from '@/app/actions/patients'
import Link from 'next/link'

export default function NewPatientPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    const result = await createPatient(formData)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Uğurla əlavə edildi!' })
      // Formu temizlemek
      ;(document.getElementById('patientForm') as HTMLFormElement).reset()
    } else {
      setMessage({ type: 'error', text: result.error || 'Xəta baş verdi' })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-b-[4rem] shadow-2xl -z-10"></div>
      
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-10 text-white mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Yeni Xəstə Qeydiyyatı</h1>
          <Link href="/" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl backdrop-blur-md transition-colors text-sm font-semibold shadow-sm">
            ← Ana Səhifəyə qayıt
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            {message.text && (
              <div className={`p-4 rounded-2xl mb-8 flex items-center shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <span className="text-2xl mr-4">{message.type === 'success' ? '✅' : '⚠️'}</span>
                <p className="font-semibold">{message.text}</p>
              </div>
            )}

            <form id="patientForm" action={handleSubmit} className="space-y-10">
              
              {/* Sahibin Məlumatları */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
                  <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg text-lg">👤</span> Heyvan Sahibinin Məlumatları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 shadow-inner">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ad və Soyad <span className="text-red-500">*</span></label>
                    <input type="text" name="ownerName" required className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm" placeholder="Məs: Əzizov Rüfət" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Nömrəsi <span className="text-red-500">*</span></label>
                    <input type="tel" name="ownerPhone" required className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm" placeholder="+99455..." />
                  </div>
                </div>
              </div>

              {/* Heyvanın Məlumatları */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
                  <span className="bg-purple-100 text-purple-600 p-2 rounded-lg text-lg">🐕</span> Xəstə (Heyvan) Məlumatları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 shadow-inner">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Heyvanın Adı <span className="text-red-500">*</span></label>
                    <input type="text" name="patientName" required className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm" placeholder="Məs: Max, Bella" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Növü <span className="text-red-500">*</span></label>
                    <select name="species" required className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm cursor-pointer">
                      <option value="">Siyahıdan seçin...</option>
                      <option value="İt">İt</option>
                      <option value="Pişik">Pişik</option>
                      <option value="Quş">Quş</option>
                      <option value="Sürünən">Sürünən</option>
                      <option value="Digər">Digər</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cinsi (Törəmə)</label>
                    <input type="text" name="breed" className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm" placeholder="Məs: Qızıl Retriver, Van pişiyi" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-indigo-700 mb-2">Çip / Barkod Nömrəsi</label>
                    <input type="text" name="chipNumber" className="w-full px-5 py-3.5 rounded-xl border-2 border-indigo-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-indigo-50/50 shadow-inner font-mono text-indigo-900" placeholder="Skanerlə oxudun..." />
                    <p className="text-xs text-slate-500 mt-2 font-medium">✨ Avtomatik oxutma üçün kursoru bu xanaya qoyub RFID cihazını işə salın.</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl transition-all ${loading ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30 hover:-translate-y-1'}`}>
                  {loading ? 'Bazaya yüklənir...' : 'Xəstəni Qeydiyyata Al'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
