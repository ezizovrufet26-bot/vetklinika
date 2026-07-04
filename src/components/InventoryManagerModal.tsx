'use client'

import { useState } from 'react'
import { PlusCircle, Loader2, X } from 'lucide-react'
import { createProduct } from '@/app/actions/billing'

export default function InventoryManagerModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const formData = new FormData(e.currentTarget)
    
    try {
      await createProduct({
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        price: parseFloat(formData.get('price') as string),
        stock: parseInt(formData.get('stock') as string),
        minStock: parseInt(formData.get('minStock') as string),
        unit: formData.get('unit') as string,
      })
      setIsOpen(false)
    } catch (error) {
      setMessage('Xəta baş verdi. Məlumatları yoxlayın.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-premium hover:brightness-110 transition-all"
      >
        <PlusCircle className="w-4 h-4" /> Yeni Məhsul / Xidmət
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-extrabold flex items-center gap-2">
                📦 Anbara Əlavə Et
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-secondary text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && <div className="mb-4 text-sm font-bold text-destructive">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Məhsulun / Xidmətin Adı</label>
                <input required name="name" type="text" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary" placeholder="Məs: Qan Analizi və ya Vitamin" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Kateqoriya</label>
                  <select required name="category" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary">
                    <option value="Dərman">Dərman</option>
                    <option value="Xidmət">Xidmət</option>
                    <option value="Yem">Yem</option>
                    <option value="Ləvazimat">Ləvazimat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Satış Qiyməti (₼)</label>
                  <input required name="price" type="number" step="0.01" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Mövcud Stok</label>
                  <input required name="stock" type="number" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary" defaultValue="1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Kritik Hədd</label>
                  <input required name="minStock" type="number" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary" defaultValue="5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Ölçü vahidi</label>
                  <input required name="unit" type="text" className="w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary" placeholder="ədəd, ml..." defaultValue="ədəd" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl shadow-glow hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yaddaşda Saxla'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
