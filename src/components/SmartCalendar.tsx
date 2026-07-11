'use client'

import { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import azLocale from '@fullcalendar/core/locales/az'
import { createAppointment, updateAppointmentStatus, rescheduleAppointment } from '@/app/actions/calendar'

export default function SmartCalendar({ initialEvents, patients }: { initialEvents: any[], patients: any[] }) {
  const calendarRef = useRef<FullCalendar>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentView, setCurrentView] = useState('timeGridWeek')
  const [title, setTitle] = useState('')

  useEffect(() => {
    // Initialize title after render
    setTimeout(() => {
      if (calendarRef.current) {
        setTitle(calendarRef.current.getApi().view.title)
      }
    }, 100)
  }, [])

  const next = () => {
    const api = calendarRef.current?.getApi()
    api?.next()
    setTitle(api?.view.title || '')
  }
  const prev = () => {
    const api = calendarRef.current?.getApi()
    api?.prev()
    setTitle(api?.view.title || '')
  }
  const today = () => {
    const api = calendarRef.current?.getApi()
    api?.today()
    setTitle(api?.view.title || '')
  }
  const changeView = (viewName: string) => {
    const api = calendarRef.current?.getApi()
    api?.changeView(viewName)
    setCurrentView(viewName)
    setTitle(api?.view.title || '')
  }

  const events = initialEvents.map(app => ({
    id: app.id,
    title: `${app.patient.name} - ${app.reason}`,
    start: app.date,
    backgroundColor: app.status === 'PENDING' ? '#fbbf24' : app.status === 'APPROVED' ? '#34d399' : '#f43f5e',
    borderColor: 'transparent',
    textColor: '#1e293b',
    extendedProps: {
      status: app.status
    }
  }))

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date)
    setShowModal(true)
  }

  const handleEventClick = async (arg: any) => {
    const currentStatus = arg.event.extendedProps.status
    if (currentStatus === 'PENDING') {
      if (window.confirm('Bu randevunu TƏSDİQLƏYİRSİNİZ (Approve)?\nOk basdıqda randevu yaşıla çevriləcək (və gələcəkdə WhatsApp mesajı gedəcək).')) {
         await updateAppointmentStatus(arg.event.id, 'APPROVED')
      }
    }
  }

  const handleEventDrop = async (arg: any) => {
    if (window.confirm('Randevunun vaxtını dəyişdirməyə əminsiniz?')) {
      await rescheduleAppointment(arg.event.id, arg.event.start)
    } else {
      arg.revert()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const patientId = formData.get('patientId') as string
    const reason = formData.get('reason') as string
    
    if (selectedDate && patientId && reason) {
      await createAppointment({ patientId, date: selectedDate, reason })
      setShowModal(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Custom Tailwind Header (Replacing ugly generic FullCalendar toolbar) */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-2 rounded-2xl shadow-soft border border-border">
        <div className="flex items-center gap-4">
          <button onClick={today} className="px-6 py-2.5 bg-secondary hover:bg-muted text-foreground font-bold rounded-xl transition-all shadow-soft active:scale-95">Bu Gün</button>
          <div className="flex gap-1 bg-secondary/50 p-1.5 rounded-xl border border-border shadow-inner">
            <button onClick={prev} className="p-2 hover:bg-card rounded-lg transition-all shadow-soft active:scale-95 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={next} className="p-2 hover:bg-card rounded-lg transition-all shadow-soft active:scale-95 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <h2 className="text-2xl font-black text-foreground min-w-[250px] text-center capitalize drop-shadow-sm">{title}</h2>
        </div>
        <div className="flex bg-secondary/50 p-1.5 rounded-xl border border-border shadow-inner mt-4 md:mt-0">
          <button onClick={() => changeView('dayGridMonth')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${currentView === 'dayGridMonth' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Ay</button>
          <button onClick={() => changeView('timeGridWeek')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${currentView === 'timeGridWeek' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Həftə</button>
          <button onClick={() => changeView('timeGridDay')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${currentView === 'timeGridDay' ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Gün</button>
        </div>
      </div>

      <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-soft p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          events={events}
          editable={true}
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="700px"
          slotMinTime="09:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          locales={[azLocale]}
          locale="az"
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2rem] p-8 w-full max-w-lg shadow-premium border border-border transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                ✨ Yeni Randevu
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-muted text-muted-foreground transition-colors">
                ✕
              </button>
            </div>

            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center text-2xl shadow-soft">
                🗓️
              </div>
              <div>
                <p className="text-xs text-primary/70 font-bold uppercase tracking-wider">Seçilmiş Tarix</p>
                <p className="text-primary font-bold">{selectedDate?.toLocaleString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 pl-1">Kimi gözləyirik? (Xəstə)</label>
                <select name="patientId" required className="w-full bg-secondary/50 border-2 border-border hover:border-ring/40 rounded-2xl p-4 text-foreground font-medium outline-none focus:border-ring focus:bg-card transition-all">
                  <option value="">Siyahıdan seçin...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species}) - Sahib: {p.owner?.firstName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 pl-1">Ziyarət Səbəbi</label>
                <input type="text" name="reason" required className="w-full bg-secondary/50 border-2 border-border hover:border-ring/40 rounded-2xl p-4 text-foreground font-medium outline-none focus:border-ring focus:bg-card transition-all placeholder:text-muted-foreground/60" placeholder="Məs: Ümumi baxış, Gənə əleyhinə damla..." />
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:brightness-110 transition-all shadow-premium flex justify-center items-center gap-2 text-lg">
                  <span>Gözləməyə (Pending) Əlavə Et</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
