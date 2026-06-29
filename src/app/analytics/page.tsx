import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AnalyticsCharts from '@/components/AnalyticsCharts'

export default async function AnalyticsPage() {
  const [patients, invoices, appointments] = await Promise.all([
    prisma.patient.findMany(),
    prisma.invoice.findMany(),
    prisma.appointment.findMany()
  ])

  // Top Metrics
  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
  const totalPatients = patients.length
  const totalAppointments = appointments.length

  // Species distribution for Pie Chart
  const speciesCount: Record<string, number> = {}
  patients.forEach(p => {
    speciesCount[p.species] = (speciesCount[p.species] || 0) + 1
  })
  const speciesData = Object.entries(speciesCount).map(([name, value]) => ({ name, value }))

  // Revenue trend (last 6 months dummy/real logic)
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
  const revenueByMonth = new Array(12).fill(0)
  invoices.filter(i => i.status === 'PAID').forEach(inv => {
    const m = new Date(inv.createdAt).getMonth()
    revenueByMonth[m] += inv.totalAmount
  })
  
  const currentMonth = new Date().getMonth()
  // Get last 6 months
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 rounded-b-[4rem] -z-10 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_transparent_50%)]"></div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="text-white">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/" className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </Link>
              <h1 className="text-4xl font-black tracking-tight drop-shadow-lg">
                Klinika <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-fuchsia-200">Analitikası</span>
              </h1>
            </div>
            <p className="text-indigo-100/80 text-sm font-medium tracking-wide ml-14">Ağıllı İdarəetmə Paneli</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-indigo-200/80 text-xs font-bold uppercase tracking-wider">Ümumi Gəlir</p>
              <p className="text-2xl font-black text-white">{totalRevenue.toFixed(0)} ₼</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-indigo-200/80 text-xs font-bold uppercase tracking-wider">Xəstələr</p>
              <p className="text-2xl font-black text-white">{totalPatients}</p>
            </div>
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-indigo-200/80 text-xs font-bold uppercase tracking-wider">Randevular</p>
              <p className="text-2xl font-black text-white">{totalAppointments}</p>
            </div>
          </div>
        </header>

        <div className="mt-8">
           <AnalyticsCharts speciesData={speciesData} trendData={trendData} />
        </div>
      </main>
    </div>
  )
}
