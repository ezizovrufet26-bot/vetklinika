import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import AnalyticsCharts from '@/components/AnalyticsCharts'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [patients, invoices, appointments] = await Promise.all([
    prisma.patient.findMany(),
    prisma.invoice.findMany(),
    prisma.appointment.findMany()
  ])

  // Əsas metrikalar
  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
  const totalPatients = patients.length
  const totalAppointments = appointments.length

  // Növ paylanması (pie chart)
  const speciesCount: Record<string, number> = {}
  patients.forEach(p => {
    speciesCount[p.species] = (speciesCount[p.species] || 0) + 1
  })
  const speciesData = Object.entries(speciesCount).map(([name, value]) => ({ name, value }))

  // Son 6 ayın gəlir trendi
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
  const revenueByMonth = new Array(12).fill(0)
  invoices.filter(i => i.status === 'PAID').forEach(inv => {
    const m = new Date(inv.createdAt).getMonth()
    revenueByMonth[m] += inv.totalAmount
  })

  const currentMonth = new Date().getMonth()
  const trendData = []
  for (let i = 5; i >= 0; i--) {
    let mIndex = currentMonth - i
    if (mIndex < 0) mIndex += 12
    trendData.push({
      name: months[mIndex],
      gəlir: revenueByMonth[mIndex]
    })
  }

  return (
    <AppShell>
      <PageHeader
        title="Klinika"
        highlight="Analitikası"
        subtitle="Gəlir trendi, xəstə paylanması və randevu statistikası"
        actions={
          <>
            <div className="bg-success/10 border border-success/25 px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-success text-[10px] font-extrabold uppercase tracking-wider">Ümumi Gəlir</p>
              <p className="text-xl font-display font-extrabold text-success">{totalRevenue.toFixed(0)} ₼</p>
            </div>
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Xəstələr</p>
              <p className="text-xl font-display font-extrabold">{totalPatients}</p>
            </div>
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Randevular</p>
              <p className="text-xl font-display font-extrabold">{totalAppointments}</p>
            </div>
          </>
        }
      />

      <AnalyticsCharts speciesData={speciesData} trendData={trendData} />
    </AppShell>
  )
}
