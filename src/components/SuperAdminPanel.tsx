'use client'

import { useState, useEffect } from 'react'
import { Crown, Check, X, Building2, User, Phone, ShieldCheck, Lock, Sparkles, KeyRound } from 'lucide-react'
import { AccessRequest } from './RegisterRequestModal'

const MASTER_PIN = '7777' // Sizin xüsusi SuperAdmin gizli kodunuz

export default function SuperAdminPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [inputPin, setInputPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const loadRequests = () => {
    const json = localStorage.getItem('vet_access_requests')
    if (json) {
      try {
        setRequests(JSON.parse(json))
      } catch (e) {
        console.error(e)
      }
    } else {
      const demoList: AccessRequest[] = [
        {
          id: 'req-demo-1',
          doctorName: 'Dr. Famil Quliyev',
          clinicName: 'Sumqayıt Vet Hospital',
          phone: '+994 50 987 65 43',
          status: 'PENDING',
          createdAt: '17:40'
        }
      ]
      setRequests(demoList)
      localStorage.setItem('vet_access_requests', JSON.stringify(demoList))
    }
  }

  useEffect(() => {
    loadRequests()
    const handleUpdate = () => loadRequests()
    window.addEventListener('accessRequestsUpdate', handleUpdate)
    return () => window.removeEventListener('accessRequestsUpdate', handleUpdate)
  }, [])

  const handleOpenModal = () => {
    const savedAuth = sessionStorage.getItem('superadmin_authenticated')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
    setIsOpen(true)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPin === MASTER_PIN) {
      setIsAuthenticated(true)
      sessionStorage.setItem('superadmin_authenticated', 'true')
      setPinError(false)
      setInputPin('')
    } else {
      setPinError(true)
    }
  }

  const handleApprove = (req: AccessRequest) => {
    const updated = requests.map(r => r.id === req.id ? { ...r, status: 'APPROVED' as const } : r)
    setRequests(updated)
    localStorage.setItem('vet_access_requests', JSON.stringify(updated))

    const savedClinicsJson = localStorage.getItem('vet_clinics_list')
    const currentClinics = savedClinicsJson ? JSON.parse(savedClinicsJson) : []
    const newClinic = { id: 'clinic-' + Date.now(), name: req.clinicName }
    const updatedClinics = [...currentClinics, newClinic]
    localStorage.setItem('vet_clinics_list', JSON.stringify(updatedClinics))
    window.dispatchEvent(new Event('clinicChange'))
  }

  const handleReject = (reqId: string) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'REJECTED' as const } : r)
    setRequests(updated)
    localStorage.setItem('vet_access_requests', JSON.stringify(updated))
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <>
      {/* Trigger Floating Crown Button for SuperAdmin */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-8 left-8 z-50 bg-slate-900 hover:bg-emerald-600 text-amber-400 hover:text-white px-5 py-3.5 rounded-full shadow-2xl border border-amber-400/40 flex items-center gap-3 font-black text-xs transition-all hover:scale-105 active:scale-95 group"
      >
        <Crown className="w-5 h-5 text-amber-400 group-hover:text-white animate-bounce" />
        <span>👑 Admin & Yaradıcı Paneli</span>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
            {pendingCount} YENİ
          </span>
        )}
      </button>

      {/* SuperAdmin Modal Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl border border-slate-700/80 relative space-y-6 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {!isAuthenticated ? (
              /* Password / PIN Verification Screen */
              <div className="py-6 text-center space-y-6 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-3xl mx-auto shadow-inner">
                  🔑
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Yaradıcı / Admin Girişi</h3>
                  <p className="text-xs text-slate-400 font-medium">Bu panel yalnız sistem sahibi (Siz) üçün qorunur. Giriş üçün gizli kodu daxil edin.</p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={inputPin}
                      onChange={(e) => {
                        setInputPin(e.target.value)
                        setPinError(false)
                      }}
                      placeholder="Gizli Kodu Yazın (Məs: 7777)"
                      required
                      className="w-full text-center tracking-[0.5em] text-xl px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl font-black text-amber-400 outline-none focus:border-amber-400 transition-all placeholder:tracking-normal placeholder:text-xs placeholder:font-bold placeholder:text-slate-500"
                    />
                    {pinError && (
                      <p className="text-xs font-bold text-red-400 animate-shake">❌ Yanlış gizli kod! Yenidən cəhd edin.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" /> Paneli Aç Və Təsdiqlə
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated Admin Dashboard */
              <>
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-2xl">
                    👑
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                      SuperAdmin İdarəetmə Mərkəzi
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Reklamdan gələn müştərilərin qeydiyyat təsdiqləri və giriş icazələri (Gizli Kod Aktivdir)</p>
                  </div>
                </div>

                {/* Request List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Daxil Olan Müştəri Müraciətləri ({requests.length})
                  </h4>

                  {requests.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">Hələ ki müştəri müraciəti yoxdur.</p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-600"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-emerald-400" />
                              <span className="font-black text-sm text-white">{req.doctorName}</span>
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-md">
                                {req.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-bold flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-amber-400" /> {req.clinicName}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-teal-400" /> {req.phone}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                            {req.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleReject(req.id)}
                                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-xs rounded-xl transition-all"
                                >
                                  İmtina Et
                                </button>
                                <button
                                  onClick={() => handleApprove(req)}
                                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" /> ✅ OK (Təsdiqlə)
                                </button>
                              </>
                            ) : req.status === 'APPROVED' ? (
                              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black rounded-xl flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> ✅ Təsdiqləndi & Giriş Verildi
                              </span>
                            ) : (
                              <span className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold rounded-xl">
                                ❌ İmtina Edildi
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
