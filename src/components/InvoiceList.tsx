'use client'

import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import { updateInvoiceStatus } from '@/app/actions/billing'
import Badge from './ui/badge'

const statusConfig = {
  UNPAID:  { label: 'Ödənməyib', tone: 'destructive' as const },
  PAID:    { label: 'Ödənilib',  tone: 'success' as const },
  PARTIAL: { label: 'Qismən',   tone: 'warning' as const },
}

export default function InvoiceList({ invoices }: { invoices: any[] }) {
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL')

  const filtered = filter === 'ALL' ? invoices : invoices.filter(i => i.status === filter)

  if (invoices.length === 0) return (
    <div className="text-center py-16">
      <p className="text-6xl mb-4">🧾</p>
      <p className="text-xl font-bold text-muted-foreground">Hələ heç bir qəbiz yoxdur</p>
      <p className="text-muted-foreground mt-2">Yuxarıdakı "Yeni Qəbiz Yarat" düyməsindən başlayın</p>
    </div>
  )

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-secondary/50 p-1.5 rounded-2xl border border-border shadow-inner w-fit">
        {(['ALL', 'UNPAID', 'PAID'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-2.5 font-bold rounded-xl transition-all text-sm ${filter === f ? 'bg-card shadow-soft text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {f === 'ALL' ? 'Hamısı' : f === 'UNPAID' ? '⏳ Ödənməyib' : '✅ Ödənilib'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(inv => {
          const st = statusConfig[inv.status as keyof typeof statusConfig] || statusConfig.UNPAID
          return (
            <div key={inv.id} className="bg-card rounded-2xl border border-border shadow-soft hover:shadow-premium transition-all p-5 flex flex-col md:flex-row md:items-center gap-4">
              {/* Invoice No */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-primary-soft rounded-xl flex items-center justify-center text-xl font-black text-primary border border-primary/20">
                  🧾
                </div>
                <div>
                  <p className="font-black text-foreground text-lg">{inv.invoiceNo}</p>
                  <p className="text-sm text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('az-AZ')}</p>
                </div>
              </div>

              {/* Patient */}
              <div className="flex-1">
                <p className="font-bold text-foreground">{inv.patient?.name}</p>
                <p className="text-sm text-muted-foreground">{inv.patient?.owner?.firstName} {inv.patient?.owner?.lastName || ''}</p>
              </div>

              {/* Items count */}
              <div className="text-center">
                <p className="font-bold text-foreground">{inv.items?.length || 0} xidmət</p>
                <p className="text-xs text-muted-foreground">maddə</p>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="text-2xl font-black text-foreground">{inv.totalAmount.toFixed(2)}<span className="text-base ml-1">₼</span></p>
              </div>

              {/* Status */}
              <Badge tone={st.tone} className="text-sm normal-case">
                <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                {st.label}
              </Badge>

              {/* Actions */}
              <div className="flex gap-2">
                {inv.status === 'UNPAID' && (
                  <button onClick={() => updateInvoiceStatus(inv.id, 'PAID')}
                    className="px-4 py-2 bg-primary hover:brightness-110 text-primary-foreground text-sm font-bold rounded-xl transition-colors">
                    ✓ Ödənildi
                  </button>
                )}
                <PDFDownloadLink document={<InvoicePDF invoice={inv} />} fileName={`${inv.invoiceNo}.pdf`}>
                  {({ loading }) => (
                    <button className="px-4 py-2 bg-secondary hover:bg-muted text-foreground text-sm font-bold rounded-xl transition-colors">
                      {loading ? '...' : '⬇ PDF'}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
