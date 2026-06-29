'use client'

import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import { updateInvoiceStatus } from '@/app/actions/billing'

const statusConfig = {
  UNPAID:  { label: 'Ödənməyib', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  PAID:    { label: 'Ödənilib',  bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PARTIAL: { label: 'Qismən',   bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}

export default function InvoiceList({ invoices }: { invoices: any[] }) {
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL')

  const filtered = filter === 'ALL' ? invoices : invoices.filter(i => i.status === filter)

  if (invoices.length === 0) return (
    <div className="text-center py-16">
      <p className="text-6xl mb-4">🧾</p>
      <p className="text-xl font-bold text-slate-400">Hələ heç bir qəbiz yoxdur</p>
      <p className="text-slate-400 mt-2">Yuxarıdakı "Yeni Qəbiz Yarat" düyməsindən başlayın</p>
    </div>
  )

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner w-fit">
        {(['ALL', 'UNPAID', 'PAID'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-2.5 font-bold rounded-xl transition-all text-sm ${filter === f ? 'bg-white shadow-md text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>
            {f === 'ALL' ? 'Hamısı' : f === 'UNPAID' ? '⏳ Ödənməyib' : '✅ Ödənilib'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(inv => {
          const st = statusConfig[inv.status as keyof typeof statusConfig] || statusConfig.UNPAID
          return (
            <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center gap-4">
              {/* Invoice No */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xl font-black text-emerald-700 border border-emerald-100">
                  🧾
                </div>
                <div>
                  <p className="font-black text-slate-800 text-lg">{inv.invoiceNo}</p>
                  <p className="text-sm text-slate-500">{new Date(inv.createdAt).toLocaleDateString('az-AZ')}</p>
                </div>
              </div>

              {/* Patient */}
              <div className="flex-1">
                <p className="font-bold text-slate-700">{inv.patient?.name}</p>
                <p className="text-sm text-slate-400">{inv.patient?.owner?.firstName} {inv.patient?.owner?.lastName || ''}</p>
              </div>

              {/* Items count */}
              <div className="text-center">
                <p className="font-bold text-slate-600">{inv.items?.length || 0} xidmət</p>
                <p className="text-xs text-slate-400">maddə</p>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="text-2xl font-black text-slate-800">{inv.totalAmount.toFixed(2)}<span className="text-base ml-1">₼</span></p>
              </div>

              {/* Status */}
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${st.bg}`}>
                <div className={`w-2 h-2 rounded-full ${st.dot}`}></div>
                <span className={`text-sm font-bold ${st.text}`}>{st.label}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {inv.status === 'UNPAID' && (
                  <button onClick={() => updateInvoiceStatus(inv.id, 'PAID')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
                    ✓ Ödənildi
                  </button>
                )}
                <PDFDownloadLink document={<InvoicePDF invoice={inv} />} fileName={`${inv.invoiceNo}.pdf`}>
                  {({ loading }) => (
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
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
