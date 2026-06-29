'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateAppointmentStatus, rescheduleAndApproveAppointment } from '@/app/actions/calendar'

interface Visit {
  id: string
  visitDate: Date | string
  reason: string
  doctorNotes?: string | null
  treatment?: string | null
}

interface Vaccine {
  id: string
  name: string
  dateGiven: Date | string
  nextDueDate: Date | string
}

interface PendingAppointment {
  id: string
  date: Date | string
  reason: string
  isAiGenerated: boolean
  patient: {
    id: string
    name: string
    species: string
    owner: {
      id: string
      firstName: string
      phone: string
      messages?: { isAudio: boolean; audioUrl: string | null }[]
    }
    visits?: Visit[]
    vaccines?: Vaccine[]
  }
}

export default function PendingApprovalWidget({ initialAppointments }: { initialAppointments: any[] }) {
  const [appointments, setAppointments] = useState<PendingAppointment[]>(initialAppointments)
  const [lastCount, setLastCount] = useState(initialAppointments.length)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null)
  const [rescheduleModalId, setRescheduleModalId] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<number>(16)
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Play DING-DONG sound when a new AI appointment is added
  useEffect(() => {
    if (appointments.length > lastCount) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start)
          gain.gain.setValueAtTime(0.4, audioCtx.currentTime + start)
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration)
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.start(audioCtx.currentTime + start)
          osc.stop(audioCtx.currentTime + start + duration)
        }
        playTone(659.25, 0, 0.4)    // E5
        playTone(523.25, 0.25, 0.6)  // C5
      } catch (e) {
        console.log('Audio error or muted')
      }
    }
    setLastCount(appointments.length)
  }, [appointments.length, lastCount])

  const speakCustomerMessage = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(id)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'az-AZ'
      utterance.rate = 0.95
      utterance.onend = () => setIsPlayingAudio(null)
      utterance.onerror = () => setIsPlayingAudio(null)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleApprove = async (id: string) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    await updateAppointmentStatus(id, 'APPROVED')
    setAppointments(appointments.filter(a => a.id !== id))
  }

  const handleReject = async (id: string) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    await updateAppointmentStatus(id, 'REJECTED')
    setAppointments(appointments.filter(a => a.id !== id))
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModalId) return
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    await rescheduleAndApproveAppointment(rescheduleModalId, selectedHour)
    setAppointments(appointments.filter(a => a.id !== rescheduleModalId))
    setRescheduleModalId(null)
  }

  return (
    <>
      {/* Sleek Header Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`relative px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 ${
          appointments.length > 0
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 animate-pulse'
            : 'bg-slate-50 text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200/60'
        }`}
      >
        <span className="text-xl">📞</span>
        <span>AI Call Center</span>
        {appointments.length > 0 && (
          <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full text-xs font-black shadow-inner">
            {appointments.length}
          </span>
        )}
      </button>

      {/* Floating Call Drawer Modal */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[9999] flex items-center justify-end p-4 sm:p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl h-[90vh] shadow-2xl border border-amber-100 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 relative z-[10000]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                  📞
                </div>
                <div>
                  <h3 className="text-xl font-black">AI Call Center & Müraciətlər</h3>
                  <p className="text-xs text-amber-100 font-medium">Həkim Nəzarət Paneli ({appointments.length} Gözləyir)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel()
                  setIsOpen(false)
                }}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {appointments.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-6xl">🎉</span>
                  <h4 className="text-lg font-bold text-slate-700 mt-4">Gözləyən müraciət yoxdur!</h4>
                  <p className="text-xs text-slate-400 mt-1">Bütün AI zəngləri həkim tərəfindən cavablandırılıb.</p>
                </div>
              ) : (
                appointments.map((app) => {
                  const hasHistory = (app.patient.visits && app.patient.visits.length > 0) || (app.patient.vaccines && app.patient.vaccines.length > 0)
                  const isHistoryExpanded = showHistoryId === app.id

                  return (
                    <div key={app.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md hover:shadow-lg transition-all space-y-4">
                      
                      {/* Top Row: Tag & Time */}
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-xl text-xs font-black flex items-center gap-1.5">
                          🎙️ WhatsApp / Zəng Müraciəti
                        </span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200">
                          ⏳ {new Date(app.date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* KİM YAZIB (Owner & Patient Identity Box) */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">👤 KİM YAZIB / ZƏNG EDİB?</p>
                          <h4 className="text-base font-black text-slate-800 mt-0.5">
                            {app.patient.owner.firstName} <span className="text-xs font-semibold text-slate-500">(📞 {app.patient.owner.phone})</span>
                          </h4>
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">
                            🐾 Xəstə: {app.patient.name} ({app.patient.species})
                          </p>
                        </div>

                        {/* History Toggle Button */}
                        <button
                          onClick={() => setShowHistoryId(isHistoryExpanded ? null : app.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                            hasHistory
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-slate-100 border-slate-200 text-slate-400'
                          }`}
                        >
                          📋 {hasHistory ? (isHistoryExpanded ? 'Tarixçəni Bağla ▲' : 'Klinik Tarixçəsi (EMR) ▼') : 'Tarixçə Yoxdur'}
                        </button>
                      </div>

                      {/* CLINICAL HISTORY DISPLAY (EMR) */}
                      {isHistoryExpanded && (
                        <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 p-4 rounded-2xl border border-indigo-200/80 space-y-3 animate-in fade-in duration-200">
                          <h5 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            📋 {app.patient.name} Haqqında Keçmiş Klinik Məlumatlar:
                          </h5>

                          {/* Visits */}
                          <div>
                            <p className="text-[11px] font-bold text-indigo-700 mb-1.5">🩺 Keçmiş Müayinə və Müalicələr:</p>
                            {app.patient.visits && app.patient.visits.length > 0 ? (
                              <div className="space-y-1.5">
                                {app.patient.visits.map((v) => (
                                  <div key={v.id} className="bg-white p-2.5 rounded-xl border border-indigo-100 text-xs shadow-sm">
                                    <div className="flex justify-between font-bold text-slate-800">
                                      <span>• {v.reason}</span>
                                      <span className="text-[10px] text-slate-400">{new Date(v.visitDate).toLocaleDateString('az-AZ')}</span>
                                    </div>
                                    {v.doctorNotes && <p className="text-[11px] text-slate-600 mt-1">📝 Həkim Qeydi: {v.doctorNotes}</p>}
                                    {v.treatment && <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">💊 Müalicə: {v.treatment}</p>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic bg-white/60 p-2 rounded-xl">Əvvəlki müayinə qeydi tapılmadı.</p>
                            )}
                          </div>

                          {/* Vaccines */}
                          <div>
                            <p className="text-[11px] font-bold text-indigo-700 mb-1.5">💉 Peyvənd Tarixçəsi & Gələcək Plan:</p>
                            {app.patient.vaccines && app.patient.vaccines.length > 0 ? (
                              <div className="space-y-1.5">
                                {app.patient.vaccines.map((vac) => (
                                  <div key={vac.id} className="bg-white p-2.5 rounded-xl border border-purple-100 text-xs shadow-sm flex justify-between items-center">
                                    <div>
                                      <span className="font-bold text-slate-800">💉 {vac.name}</span>
                                      <p className="text-[10px] text-slate-500">Vurulub: {new Date(vac.dateGiven).toLocaleDateString('az-AZ')}</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-lg">
                                      Növbəti: {new Date(vac.nextDueDate).toLocaleDateString('az-AZ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic bg-white/60 p-2 rounded-xl">Peyvənd qeydi tapılmadı.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* NƏ YAZIB / NƏ DEYİB (Customer Message Box) */}
                      <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                            💬 MÜŞTƏRİNİN YAZDIĞI / DEDİYİ MESAJ:
                          </p>

                          {app.patient.owner.messages && app.patient.owner.messages[0]?.isAudio && app.patient.owner.messages[0]?.audioUrl ? (
                            <audio 
                              controls 
                              src={app.patient.owner.messages[0].audioUrl} 
                              className="h-8 max-w-[200px]"
                            />
                          ) : (
                            <button
                              onClick={() => speakCustomerMessage(app.id, `Müştəri ${app.patient.owner.firstName} dedi ki: ${app.reason}`)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                                isPlayingAudio === app.id
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {isPlayingAudio === app.id ? '🔊 Oxunur...' : '▶️ Səsli Oxut'}
                            </button>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-slate-800 italic bg-white p-3 rounded-xl border border-amber-100 shadow-sm leading-relaxed">
                          "{app.reason}"
                        </p>
                        
                        {/* Go to Chat Button */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setIsOpen(false)
                              router.push(`/dashboard/communications?ownerId=${app.patient.owner.id}`)
                            }}
                            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-indigo-200"
                          >
                            💬 Çata Keç & Bütün Söhbəti Gör
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1"
                        >
                          ✓ Təsdiqlə (WA)
                        </button>
                        <button
                          onClick={() => setRescheduleModalId(app.id)}
                          className="py-3 px-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1"
                        >
                          ✏️ Vaxtı Dəyiş
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition-all"
                        >
                          ✕
                        </button>
                      </div>

                    </div>
                  )
                })
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Reschedule Modal */}
      {rescheduleModalId && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-amber-200">
            <h3 className="text-lg font-black text-slate-800 mb-2">✏️ Vaxtı Dəyişdirin və Təsdiqləyin</h3>
            <p className="text-xs text-slate-500 mb-4">Müştəriyə təyin etdiyiniz yeni saat üçün avtomatik WhatsApp mesajı göndəriləcək.</p>

            <label className="block text-xs font-bold text-slate-700 mb-2">Yeni Saatı Seçin:</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[9, 10, 11, 12, 14, 15, 16, 17, 18, 19].map((hour) => (
                <button
                  key={hour}
                  onClick={() => setSelectedHour(hour)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedHour === hour
                      ? 'bg-amber-500 text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {hour}:00
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRescheduleSubmit}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all"
              >
                ✓ Saat {selectedHour}:00-a Təsdiqlə
              </button>
              <button
                onClick={() => setRescheduleModalId(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
