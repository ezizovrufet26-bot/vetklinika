'use client'

import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import { createInvoice, updateInvoiceStatus } from '@/app/actions/billing'

interface Product { id: string; name: string; price: number; category: string }
interface Patient { id: string; name: string; species: string; breed?: string | null; owner: { firstName: string; lastName?: string | null; phone: string } }
interface InvoiceItem { name: string; quantity: number; unitPrice: number }

export default function InvoicePanel({ patients, products }: { patients: Patient[]; products: Product[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', quantity: 1, unitPrice: 0 }])
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState<any>(null)

  const addItem = () => setItems([...items, { name: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: field === 'name' ? val : Number(val) }
    setItems(next)
  }
  const quickAdd = (product: Product) => {
    setItems([...items.filter(i => i.name !== ''), { name: product.name, quantity: 1, unitPrice: product.price }])
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const handleSubmit = async () => {
    if (!selectedPatient) return
    const validItems = items.filter(i => i.name && i.unitPrice > 0)
    if (!validItems.length) return

    await createInvoice({ patientId: selectedPatient.id, items: validItems, notes })
    // Preview mock for PDF
    setPreview({
      invoiceNo: `QBZ-PREVIEW`,
      status: 'UNPAID',
      totalAmount: total,
      createdAt: new Date(),
      notes,
      patient: selectedPatient,
      items: validItems.map(i => ({ ...i, total: i.quantity * i.unitPrice }))
    })
    setShowCreate(false)
    setItems([{ name: '', quantity: 1, unitPrice: 0 }])
    setNotes('')
    setSelectedPatient(null)
  }

  return (
    <div>
      <button onClick={() => setShowCreate(true)}
        className="px-7 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-3">
        <span className="text-2xl">🧾</span> Yeni Qəbiz Yarat
      </button>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto pt-8">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-100 mb-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-[2rem] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">🧾 Yeni Qəbiz</h2>
                <p className="text-emerald-100 text-sm mt-1">Xidmətlər əlavə edin, qəbizi yaradın</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">🐾 Xəstəni Seçin</label>
                <select onChange={e => {
                  const p = patients.find(p => p.id === e.target.value) || null
                  setSelectedPatient(p)
                }} className="w-full border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-4 text-slate-700 font-medium outline-none focus:border-emerald-500 transition-all bg-slate-50">
                  <option value="">Siyahıdan seçin...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species}) — {p.owner.firstName}</option>)}
                </select>
              </div>

              {/* Quick Add from Products */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">⚡ Sürətli Əlavə (Anbardan)</p>
                <div className="flex flex-wrap gap-2">
                  {products.slice(0, 8).map(p => (
                    <button key={p.id} onClick={() => quickAdd(p)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl border border-emerald-200 transition-colors">
                      + {p.name} ({p.price} ₼)
                    </button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">📋 Xidmət / Məhsul Siyahısı</p>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                        placeholder="Xidmət adı..." className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                      <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                        min={1} className="w-16 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:border-emerald-400 transition-colors" />
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                        step="0.5" placeholder="₼" className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-right outline-none focus:border-emerald-400 transition-colors" />
                      <span className="text-sm font-bold text-slate-600 w-20 text-right">{(item.quantity * item.unitPrice).toFixed(2)} ₼</span>
                      <button onClick={() => removeItem(i)} className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-400 rounded-lg flex items-center justify-center transition-colors">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-3 w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-emerald-400 text-slate-500 hover:text-emerald-600 rounded-2xl text-sm font-semibold transition-all">
                  + Yeni sətir əlavə et
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">📝 Qeyd (istəyə görə)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-4 text-slate-700 text-sm outline-none focus:border-emerald-500 transition-all bg-slate-50 resize-none"
                  placeholder="Məs: 1 həftə sonra yoxlanışa gəlsin..." />
              </div>

              {/* Total & Submit */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-emerald-600 font-semibold">Ümumi Məbləğ</p>
                  <p className="text-3xl font-black text-emerald-700">{total.toFixed(2)} <span className="text-lg">₼</span></p>
                </div>
                <button onClick={handleSubmit} disabled={!selectedPatient || total === 0}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Qəbizi Yarat →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Toast */}
      {preview && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-emerald-200 p-5 flex items-center gap-4 animate-bounce-once">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">🧾</div>
          <div>
            <p className="font-black text-slate-800">Qəbiz yaradıldı!</p>
            <p className="text-sm text-slate-500">PDF-i yükləmək üçün basın</p>
          </div>
          <PDFDownloadLink document={<InvoicePDF invoice={preview} />} fileName={`${preview.invoiceNo}.pdf`}>
            {({ loading }) => (
              <button className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                {loading ? '...' : '⬇ PDF'}
              </button>
            )}
          </PDFDownloadLink>
          <button onClick={() => setPreview(null)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">✕</button>
        </div>
      )}
    </div>
  )
}
