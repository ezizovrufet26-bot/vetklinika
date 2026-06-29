import SmartCalendar from '@/components/SmartCalendar'
import { getAppointments } from '@/app/actions/calendar'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const appointments = await getAppointments()
  const patients = await prisma.patient.findMany({ include: { owner: true } })

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length
  const todayCount = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Premium Background Header */}
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-br from-indigo-900 via-[#312e81] to-purple-900 rounded-b-[4rem] z-0 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_0%_100%,_white_0%,_transparent_50%)]"></div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="text-white">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/" className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </Link>
              <h1 className="text-4xl font-black tracking-tight drop-shadow-lg font-sans">
                Ağıllı <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">Təqvim Sistemi</span>
              </h1>
            </div>
            <p className="text-indigo-100/80 text-sm font-medium tracking-wide ml-14">
              Süni İntellekt və Resepşn qeydləri üçün vahid mərkəz.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex flex-col items-center shadow-xl">
              <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Bu Gün</span>
              <span className="text-2xl font-black text-white">{todayCount}</span>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-6 py-3 rounded-2xl flex flex-col items-center shadow-xl">
              <span className="text-yellow-200/80 text-xs font-bold uppercase tracking-wider">Gözləmədə</span>
              <span className="text-2xl font-black text-yellow-300">{pendingCount}</span>
            </div>
          </div>
        </header>

        {/* Custom Styles for FullCalendar to look Premium */}
        <style dangerouslySetInnerHTML={{__html: `
          .fc { font-family: inherit; }
          .fc-theme-standard .fc-scrollgrid, 
          .fc-theme-standard th, 
          .fc-theme-standard td { border-color: #f1f5f9; }
          .fc-scrollgrid { border: none !important; }
          .fc-theme-standard th { border-top: none !important; border-left: none !important; border-right: none !important; padding-bottom: 8px; }
          .fc-theme-standard td { border-right: none !important; border-bottom: 1px solid #f1f5f9 !important; }
          .fc-col-header-cell-cushion { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; }
          .fc-timegrid-slot-label-cushion { color: #94a3b8; font-weight: 500; font-size: 0.875rem; }
          .fc-timegrid-axis-cushion { color: #cbd5e1; }
          .fc-event { border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); padding: 4px 8px; border: 1px solid rgba(255,255,255,0.4) !important; transition: all 0.2s; cursor: pointer; font-weight: 600; }
          .fc-event:hover { transform: scale(1.02) translateY(-2px); z-index: 50; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); }
          .fc-day-today { background-color: #f8fafc !important; }
          .fc-timegrid-now-indicator-line { border-color: #4f46e5; border-width: 2px; }
          .fc-timegrid-now-indicator-arrow { border-color: #4f46e5; border-width: 6px; }
          .fc-v-event .fc-event-main { color: #0f172a; }
        `}} />

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-white">
           <SmartCalendar initialEvents={appointments} patients={patients} />
        </div>
      </main>
    </div>
  )
}
