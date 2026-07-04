import SmartCalendar from '@/components/SmartCalendar'
import { getAppointments } from '@/app/actions/calendar'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const appointments = await getAppointments()
  const patients = await prisma.patient.findMany({ include: { owner: true } })

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length
  const todayCount = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length

  return (
    <AppShell>
      <PageHeader
        title="Ağıllı"
        highlight="Təqvim Sistemi"
        subtitle="AI resepşn və qeydiyyat randevuları üçün vahid mərkəz"
        actions={
          <>
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Bu Gün</p>
              <p className="text-xl font-display font-extrabold">{todayCount}</p>
            </div>
            <div className="bg-warning/10 border border-warning/25 px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-warning text-[10px] font-extrabold uppercase tracking-wider">Gözləmədə</p>
              <p className="text-xl font-display font-extrabold text-warning">{pendingCount}</p>
            </div>
          </>
        }
      />

      {/* FullCalendar-ın token-əsaslı premium görünüşü */}
      <style dangerouslySetInnerHTML={{__html: `
        .fc { font-family: inherit; }
        .fc-theme-standard .fc-scrollgrid,
        .fc-theme-standard th,
        .fc-theme-standard td { border-color: var(--border); }
        .fc-scrollgrid { border: none !important; }
        .fc-theme-standard th { border-top: none !important; border-left: none !important; border-right: none !important; padding-bottom: 8px; }
        .fc-theme-standard td { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
        .fc-col-header-cell-cushion { font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }
        .fc-timegrid-slot-label-cushion { color: var(--muted-foreground); font-weight: 500; font-size: 0.85rem; }
        .fc-timegrid-axis-cushion { color: var(--muted-foreground); opacity: 0.6; }
        .fc-event { border-radius: 10px; box-shadow: var(--shadow-soft); padding: 4px 8px; border: 1px solid var(--glass-border) !important; transition: all 0.2s; cursor: pointer; font-weight: 600; }
        .fc-event:hover { transform: scale(1.02) translateY(-2px); z-index: 50; box-shadow: var(--shadow-premium); }
        .fc-day-today { background-color: var(--primary-soft) !important; }
        .fc-timegrid-now-indicator-line { border-color: var(--primary); border-width: 2px; }
        .fc-timegrid-now-indicator-arrow { border-color: var(--primary); border-width: 6px; }
        .fc-v-event .fc-event-main { color: var(--foreground); }
        .fc .fc-button { background: var(--secondary); border: 1px solid var(--border); color: var(--foreground); font-weight: 700; border-radius: 0.75rem; text-transform: capitalize; }
        .fc .fc-button:hover { background: var(--muted); }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active { background: var(--primary); border-color: var(--primary); color: var(--primary-foreground); }
        .fc .fc-toolbar-title { font-weight: 800; letter-spacing: -0.02em; }
      `}} />

      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-soft">
        <SmartCalendar initialEvents={appointments} patients={patients} />
      </div>
    </AppShell>
  )
}
