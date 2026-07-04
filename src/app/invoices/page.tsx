import { getInvoices, getProducts } from '@/app/actions/billing'
import { prisma } from '@/lib/prisma'
import InvoicePanel from '@/components/InvoicePanel'
import InvoiceList from '@/components/InvoiceList'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

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
    <AppShell>
      <PageHeader
        title="Maliyyə &"
        highlight="Qəbzlər"
        subtitle="Faktura yaradın, ödənişləri izləyin, PDF qəbz çap edin"
        actions={
          <>
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Bu Gün</p>
              <p className="text-xl font-display font-extrabold">{todayInvoices}</p>
            </div>
            <div className="bg-success/10 border border-success/25 px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-success text-[10px] font-extrabold uppercase tracking-wider">Gəlir</p>
              <p className="text-xl font-display font-extrabold text-success">{totalRevenue.toFixed(0)} ₼</p>
            </div>
            <div className="bg-warning/10 border border-warning/25 px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-warning text-[10px] font-extrabold uppercase tracking-wider">Gözləyir</p>
              <p className="text-xl font-display font-extrabold text-warning">{pendingRevenue.toFixed(0)} ₼</p>
            </div>
          </>
        }
      />

      {/* Yeni faktura paneli */}
      <div className="mb-6">
        <InvoicePanel patients={patients as any} products={products} />
      </div>

      {/* Faktura siyahısı */}
      <div className="bg-card border border-border rounded-2xl shadow-soft p-4 sm:p-6">
        <InvoiceList invoices={invoices as any} />
      </div>
    </AppShell>
  )
}
