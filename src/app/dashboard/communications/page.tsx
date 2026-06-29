'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getOmnichannelData, sendManualReply } from '@/app/actions/communications'
import { Phone, User, Send, Paperclip, CheckCheck, Clock, Mic, Calendar as CalendarIcon, FileText, CheckCircle, XCircle } from 'lucide-react'
import { updateAppointmentStatus, rescheduleAndApproveAppointment } from '@/app/actions/calendar'

export default function CommunicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Yüklənir...</div>}>
      <CommunicationsContent />
    </Suspense>
  )
}

function CommunicationsContent() {
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [rescheduleModalId, setRescheduleModalId] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<number>(16)
  const searchParams = useSearchParams()
  const initialOwnerId = searchParams.get('ownerId')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-select owner if passed in URL
  useEffect(() => {
    if (initialOwnerId && !selectedOwnerId && contacts.length > 0) {
      setSelectedOwnerId(initialOwnerId)
    }
  }, [initialOwnerId, contacts, selectedOwnerId])

  const fetchData = async () => {
    try {
      const data = await getOmnichannelData()
      setContacts(data)
      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSend = async () => {
    if (!replyText.trim() || !selectedOwnerId) return
    const text = replyText
    setReplyText('')
    
    // Optimizm UI yenilənməsi
    const newContacts = [...contacts]
    const ownerIndex = newContacts.findIndex(o => o.id === selectedOwnerId)
    if (ownerIndex !== -1) {
      newContacts[ownerIndex].messages.push({
        id: Date.now().toString(),
        text,
        isFromClinic: true,
        createdAt: new Date()
      })
      setContacts(newContacts)
    }

    await sendManualReply(selectedOwnerId, text)
    await fetchData()
  }

  const selectedOwner = contacts.find(c => c.id === selectedOwnerId)

  // Find if the selected owner has any pending appointments
  const pendingAppointment = selectedOwner?.patients?.flatMap((p: any) => p.appointments || []).find((a: any) => a.status === 'PENDING')

  const handleApprove = async (id: string) => {
    await updateAppointmentStatus(id, 'APPROVED')
    await fetchData()
  }

  const handleReject = async (id: string) => {
    await updateAppointmentStatus(id, 'REJECTED')
    await fetchData()
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModalId) return
    await rescheduleAndApproveAppointment(rescheduleModalId, selectedHour)
    setRescheduleModalId(null)
    await fetchData()
  }

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Yüklənir...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sol Panel: Kontaktlar */}
      <div className="w-1/3 flex flex-col border-none shadow-sm bg-white overflow-hidden rounded-3xl">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-xl font-medium tracking-tight text-zinc-800">Söhbətlər</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {contacts.map(owner => {
            const lastMsg = owner.messages[owner.messages.length - 1]
            const isSelected = owner.id === selectedOwnerId
            return (
              <div 
                key={owner.id}
                onClick={() => setSelectedOwnerId(owner.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-zinc-50'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-500'}`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-zinc-900 truncate">
                      {owner.firstName} {owner.patients?.[0] ? `(${owner.patients[0].name})` : ''}
                    </h3>
                    <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                      {new Date(lastMsg?.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 truncate flex items-center gap-1">
                    {lastMsg?.isFromClinic && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    {lastMsg?.isAudio ? <><Mic className="w-3 h-3"/> Səsli Mesaj</> : lastMsg?.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sağ Panel: Çat */}
      <div className="w-2/3 flex flex-col border-none shadow-sm bg-white overflow-hidden rounded-3xl">
        {selectedOwner ? (
          <>
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-zinc-900">{selectedOwner.firstName} {selectedOwner.lastName || ''}</h2>
                <p className="text-sm text-zinc-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {selectedOwner.phone}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* History Button (if patients exist) */}
              {selectedOwner.patients?.length > 0 && (
                <div className="flex justify-center">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-white border border-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-xs font-medium shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {showHistory ? 'Klinik Tarixçəni Gizlət' : 'Klinik Tarixçəyə (EMR) Bax'}
                  </button>
                </div>
              )}

              {/* History Card View */}
              {showHistory && selectedOwner.patients?.map((patient: any) => (
                <div key={patient.id} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl mb-4 text-sm text-indigo-900">
                  <div className="font-bold flex items-center justify-between mb-2 pb-2 border-b border-indigo-200">
                    <span>🐾 {patient.name} ({patient.species})</span>
                  </div>
                  
                  {patient.visits?.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      <p className="text-xs font-semibold text-indigo-700">Keçmiş Müayinələr:</p>
                      {patient.visits.map((v: any) => (
                        <div key={v.id} className="bg-white p-2 rounded-xl border border-indigo-50 text-xs">
                          <div className="flex justify-between font-bold">
                            <span>{v.reason}</span>
                            <span className="text-indigo-400">{new Date(v.visitDate).toLocaleDateString('az-AZ')}</span>
                          </div>
                          {v.doctorNotes && <p className="text-indigo-600/80 mt-1">📝 {v.doctorNotes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-indigo-400 mb-3">Keçmiş müayinə qeydi yoxdur.</p>}

                  {patient.vaccines?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-indigo-700">Peyvəndlər:</p>
                      {patient.vaccines.map((vac: any) => (
                        <div key={vac.id} className="bg-white flex justify-between items-center p-2 rounded-xl border border-indigo-50 text-xs">
                          <span className="font-bold">💉 {vac.name}</span>
                          <span className="bg-indigo-100 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                            Növbəti: {new Date(vac.nextDueDate).toLocaleDateString('az-AZ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-indigo-400">Peyvənd qeydi yoxdur.</p>}
                </div>
              ))}

              {selectedOwner.messages.map((msg: any) => {
                const isClinic = msg.isFromClinic
                return (
                  <div key={msg.id} className={`flex ${isClinic ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isClinic ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-none'}`}>
                      {msg.isAudio && msg.audioUrl ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs opacity-70 flex items-center gap-1 mb-1">
                            <Mic className="w-3 h-3" /> AI oxudu: "{msg.text}"
                          </span>
                          <audio controls src={msg.audioUrl} className="max-w-full h-10" />
                        </div>
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <div className={`text-[10px] mt-2 flex items-center gap-1 ${isClinic ? 'text-orange-100 justify-end' : 'text-zinc-400'}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(msg.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                        {isClinic && <CheckCheck className="w-3 h-3 ml-1" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pending Actions Footer */}
            {pendingAppointment && (
              <div className="p-4 bg-amber-50 border-t border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1 uppercase tracking-wide">
                  <CalendarIcon className="w-4 h-4" /> 
                  Gözləyən Zəng/Müraciət (Müştəriyə WA Cavabı Gedəcək):
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(pendingAppointment.id)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors">
                    <CheckCircle className="w-4 h-4" /> Təsdiqlə
                  </button>
                  <button onClick={() => setRescheduleModalId(pendingAppointment.id)} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors">
                    <Clock className="w-4 h-4" /> Vaxtı Dəyiş
                  </button>
                  <button onClick={() => handleReject(pendingAppointment.id)} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors">
                    <XCircle className="w-4 h-4" /> Rədd et
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-zinc-100 bg-white">
              <div className="flex items-center gap-2">
                <button className="text-zinc-400 shrink-0 p-2 hover:bg-zinc-100 rounded-full">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  placeholder="Mesaj yazın..." 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="bg-zinc-50 border-none h-12 rounded-full px-6 text-[15px] flex-1 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <button onClick={handleSend} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 px-6 shrink-0 shadow-sm shadow-orange-200 flex items-center justify-center font-medium transition-colors">
                  <Send className="w-4 h-4 mr-2" />
                  Göndər
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-10 h-10 text-zinc-300" />
            </div>
            <p>Söhbətə başlamaq üçün soldan bir kontakt seçin.</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalId && (
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
        </div>
      )}
    </div>
  )
}
