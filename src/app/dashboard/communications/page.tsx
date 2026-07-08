'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getOmnichannelData, sendManualReply } from '@/app/actions/communications'
import { Phone, User, Send, Paperclip, CheckCheck, Clock, Mic, Calendar as CalendarIcon, FileText, CheckCircle, XCircle } from 'lucide-react'
import { updateAppointmentStatus, rescheduleAndApproveAppointment } from '@/app/actions/calendar'
import AppShell from '@/components/AppShell'

export default function CommunicationsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Yüklənir...</div>}>
        <CommunicationsContent />
      </Suspense>
    </AppShell>
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
    return <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full"><span className="animate-spin mr-2">🌀</span> Yüklənir...</div>
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      {/* Sol Panel: Kontaktlar */}
      <div className="w-1/3 flex flex-col bg-card border border-border shadow-sm overflow-hidden rounded-3xl glass-panel">
        <div className="p-6 border-b border-border bg-secondary/30">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Söhbətlər</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {contacts.map(owner => {
            const lastMsg = owner.messages[owner.messages.length - 1]
            const isSelected = owner.id === selectedOwnerId
            return (
              <div 
                key={owner.id}
                onClick={() => setSelectedOwnerId(owner.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary/50 border border-transparent'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {owner.firstName} {owner.patients?.[0] ? `(${owner.patients[0].name})` : ''}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap ml-2">
                      {new Date(lastMsg?.createdAt || new Date()).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 font-medium">
                    {lastMsg?.isFromClinic && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                    {lastMsg?.isAudio ? <><Mic className="w-3 h-3"/> Səsli Mesaj</> : lastMsg?.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sağ Panel: Çat */}
      <div className="w-2/3 flex flex-col bg-card border border-border shadow-sm overflow-hidden rounded-3xl glass-panel">
        {selectedOwner ? (
          <>
            <div className="p-5 border-b border-border bg-secondary/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedOwner.firstName} {selectedOwner.lastName || ''}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {selectedOwner.phone}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/30">
              {/* History Button (if patients exist) */}
              {selectedOwner.patients?.length > 0 && (
                <div className="flex justify-center">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-secondary/50 border border-border text-foreground px-4 py-2 rounded-full text-xs font-semibold shadow-sm hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    {showHistory ? 'Klinik Tarixçəni Gizlət' : 'Klinik Tarixçəyə (EMR) Bax'}
                  </button>
                </div>
              )}

              {/* History Card View */}
              {showHistory && selectedOwner.patients?.map((patient: any) => (
                <div key={patient.id} className="bg-primary/5 border border-primary/20 p-5 rounded-2xl mb-4 text-sm text-foreground shadow-sm">
                  <div className="font-bold flex items-center justify-between mb-3 pb-3 border-b border-primary/10">
                    <span className="text-base flex items-center gap-2"><span className="text-xl">🐾</span> {patient.name} <span className="text-muted-foreground text-xs font-medium bg-background px-2 py-0.5 rounded-full border border-border">{patient.species}</span></span>
                  </div>
                  
                  {patient.visits?.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">Keçmiş Müayinələr:</p>
                      {patient.visits.map((v: any) => (
                        <div key={v.id} className="bg-background/80 p-3 rounded-xl border border-border text-xs shadow-sm">
                          <div className="flex justify-between font-bold text-foreground">
                            <span>{v.reason}</span>
                            <span className="text-muted-foreground bg-secondary px-2 py-0.5 rounded text-[10px]">{new Date(v.visitDate).toLocaleDateString('az-AZ')}</span>
                          </div>
                          {v.doctorNotes && <p className="text-muted-foreground mt-2 leading-relaxed font-medium">📝 {v.doctorNotes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground mb-4 font-medium">Keçmiş müayinə qeydi yoxdur.</p>}

                  {patient.vaccines?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">Peyvəndlər:</p>
                      {patient.vaccines.map((vac: any) => (
                        <div key={vac.id} className="bg-background/80 flex justify-between items-center p-3 rounded-xl border border-border text-xs shadow-sm">
                          <span className="font-bold text-foreground flex items-center gap-1.5">💉 {vac.name}</span>
                          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg font-bold text-[10px]">
                            Növbəti: {new Date(vac.nextDueDate).toLocaleDateString('az-AZ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground font-medium">Peyvənd qeydi yoxdur.</p>}
                </div>
              ))}

              {selectedOwner.messages.map((msg: any) => {
                const isClinic = msg.isFromClinic
                return (
                  <div key={msg.id} className={`flex ${isClinic ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${isClinic ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none border border-border'}`}>
                      {msg.isAudio && msg.audioUrl ? (
                        <div className="flex flex-col gap-2">
                          <span className={`text-xs opacity-80 flex items-center gap-1.5 mb-1 font-medium ${isClinic ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                            <Mic className="w-3.5 h-3.5" /> AI oxudu: "{msg.text}"
                          </span>
                          <audio controls src={msg.audioUrl} className="max-w-full h-10 rounded-lg" />
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <div className={`text-[10px] mt-2 flex items-center gap-1 font-medium ${isClinic ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'}`}>
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
              <div className="p-4 bg-primary/5 border-t border-primary/20">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-primary/20 text-primary">
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </span>
                  Gözləyən Zəng/Müraciət (Müştəriyə WA Cavabı Gedəcək):
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(pendingAppointment.id)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors border border-emerald-700/50">
                    <CheckCircle className="w-4 h-4" /> Təsdiqlə
                  </button>
                  <button onClick={() => setRescheduleModalId(pendingAppointment.id)} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors border border-amber-600/50">
                    <Clock className="w-4 h-4" /> Vaxtı Dəyiş
                  </button>
                  <button onClick={() => handleReject(pendingAppointment.id)} className="px-4 py-2.5 bg-background border border-border hover:bg-secondary text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                    <XCircle className="w-4 h-4 text-red-500" /> Rədd et
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3">
                <button className="text-muted-foreground shrink-0 p-2 hover:bg-secondary rounded-full transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  placeholder="Mesaj yazın..." 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="bg-background border border-input h-12 rounded-full px-6 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground"
                />
                <button onClick={handleSend} disabled={!replyText.trim()} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-full h-12 px-6 shrink-0 shadow-sm flex items-center justify-center font-bold text-sm transition-all">
                  <Send className="w-4 h-4 mr-2" />
                  Göndər
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6 border border-border shadow-sm">
              <Phone className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="font-medium">Söhbətə başlamaq üçün soldan bir kontakt seçin.</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border glass-panel">
            <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2"><span>✏️</span> Vaxtı Dəyişdirin</h3>
            <p className="text-xs text-muted-foreground mb-6 font-medium">Müştəriyə təyin etdiyiniz yeni saat üçün avtomatik WhatsApp mesajı göndəriləcək.</p>

            <label className="block text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Yeni Saatı Seçin:</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[9, 10, 11, 12, 14, 15, 16, 17, 18, 19].map((hour) => (
                <button
                  key={hour}
                  onClick={() => setSelectedHour(hour)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedHour === hour
                      ? 'bg-primary text-primary-foreground shadow-md scale-105 border-transparent'
                      : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                  }`}
                >
                  {hour}:00
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRescheduleSubmit}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-sm"
              >
                ✓ Saat {selectedHour}:00-a Təsdiqlə
              </button>
              <button
                onClick={() => setRescheduleModalId(null)}
                className="px-5 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm rounded-xl transition-all border border-border"
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
