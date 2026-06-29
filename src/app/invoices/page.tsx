import { getInvoices, getProducts } from '@/app/actions/billing'
import { prisma } from '@/lib/prisma'
import InvoicePanel from '@/components/InvoicePanel'
import InvoiceList from '@/components/InvoiceList'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const [invoices, products, patients] = await Promise.all([
    getInvoices(),
    getProducts(),
    prisma.patient.findMany({ include: { owner: true } })
  ])

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
  const pendingRevenue = invoices.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.totalAmount, 0)
  const todayInvoices = invoices.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).length

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Premium Gradient Header */}
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 rounded-b-[4rem] -z-10 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_transparent_50%)]"></div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="text-white">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/" className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </Link>
              <h1 className="text-4xl font-black tracking-tight drop-shadow-lg">
                Maliyyə & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-cyan-200">Qəbizlər</span>
              </h1>
            </div>
            <p className="text-emerald-100/80 text-sm font-medium tracking-wide ml-14">EzyVet səviyyəsində maliyyə idarəetməsi</p>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-emerald-200/80 text-xs font-bold uppercase tracking-wider">Bu Gün</p>
              <p className="text-2xl font-black text-white">{todayInvoices}</p>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-emerald-200/80 text-xs font-bold uppercase tracking-wider">Gəlir</p>
              <p className="text-2xl font-black text-emerald-300">{totalRevenue.toFixed(0)} ₼</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-yellow-200/80 text-xs font-bold uppercase tracking-wider">Gözləyir</p>
              <p className="text-2xl font-black text-yellow-300">{pendingRevenue.toFixed(0)} ₼</p>
            </div>
          </div>
        </header>

        {/* Create Button */}
        <div className="mb-6">
          <InvoicePanel patients={patients as any} products={products} />
        </div>

        {/* Invoice List */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.07)] border border-white p-6">
          <InvoiceList invoices={invoices as any} />
        </div>
      </main>
    </div>
  )
}
