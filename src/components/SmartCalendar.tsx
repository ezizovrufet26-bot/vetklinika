'use client'

import { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import azLocale from '@fullcalendar/core/locales/az'
import { createAppointment, updateAppointmentStatus } from '@/app/actions/calendar'

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
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4">
          <button onClick={today} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm active:scale-95">Bu Gün</button>
          <div className="flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
            <button onClick={prev} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95 text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={next} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95 text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <h2 className="text-2xl font-black text-slate-800 min-w-[250px] text-center capitalize drop-shadow-sm">{title}</h2>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shadow-inner mt-4 md:mt-0">
          <button onClick={() => changeView('dayGridMonth')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${currentView === 'dayGridMonth' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Ay</button>
          <button onClick={() => changeView('timeGridWeek')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${currentView === 'timeGridWeek' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Həftə</button>
          <button onClick={() => changeView('timeGridDay')} className={`px-6 py-2.5 font-bold rounded-lg transition-all ${currentView === 'timeGridDay' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Gün</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          events={events}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.2)] border border-slate-100 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                ✨ Yeni Randevu
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                🗓️
              </div>
              <div>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Seçilmiş Tarix</p>
                <p className="text-indigo-900 font-bold">{selectedDate?.toLocaleString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 pl-1">Kimi gözləyirik? (Xəstə)</label>
                <select name="patientId" required className="w-full bg-slate-50/50 border-2 border-slate-100 hover:border-indigo-200 rounded-2xl p-4 text-slate-700 font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all">
                  <option value="">Siyahıdan seçin...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species}) - Sahib: {p.owner?.firstName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 pl-1">Ziyarət Səbəbi</label>
                <input type="text" name="reason" required className="w-full bg-slate-50/50 border-2 border-slate-100 hover:border-indigo-200 rounded-2xl p-4 text-slate-700 font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Məs: Ümumi baxış, Gənə əleyhinə damla..." />
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex justify-center items-center gap-2 text-lg">
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
