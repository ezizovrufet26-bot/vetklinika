'use client'

import { useState } from 'react'
import { Pill, HeartHandshake, Beef, Package, Pencil, Trash2, Plus, Minus, Loader2, X } from 'lucide-react'
import Badge from '@/components/ui/badge'
import { updateProduct, adjustProductStock, deleteProduct } from '@/app/actions/billing'

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  unit: string
}

const CategoryIcon = ({ cat, className }: { cat: string; className?: string }) => {
  if (cat === 'Xidmət') return <HeartHandshake className={className} />
  if (cat === 'Dərman') return <Pill className={className} />
  if (cat === 'Yem') return <Beef className={className} />
  return <Package className={className} />
}

const inputCls =
  'w-full p-3 rounded-xl bg-secondary/50 border border-input text-sm font-medium outline-none focus:border-primary'

export default function InventoryProductCard({ product }: { product: Product }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isLow = product.stock <= product.minStock && product.minStock > 0

  const handleAdjust = async (delta: number) => {
    setBusy(true)
    await adjustProductStock(product.id, delta)
    setBusy(false)
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await updateProduct(product.id, {
      name: String(fd.get('name') || ''),
      category: String(fd.get('category') || product.category),
      price: parseFloat(String(fd.get('price'))) || 0,
      stock: parseInt(String(fd.get('stock'))) || 0,
      minStock: parseInt(String(fd.get('minStock'))) || 0,
      unit: String(fd.get('unit') || 'ədəd'),
    })
    setBusy(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowEdit(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    await deleteProduct(product.id)
    setBusy(false)
    setShowDelete(false)
  }

  return (
    <>
      <div
        className={`group bg-card rounded-2xl border shadow-soft hover:shadow-premium transition-shadow p-5 ${
          isLow ? 'border-destructive/30' : 'border-border'
        }`}
      >
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {isLow && <Badge tone="destructive">AZ!</Badge>}
            <button
              onClick={() => setShowEdit(true)}
              title="Redaktə et"
              className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-primary hover:bg-primary-soft opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              title="Sil"
              className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-display font-extrabold">
              {product.price} <span className="text-sm font-medium text-muted-foreground">₼</span>
            </p>
            <p className={`text-sm font-semibold mt-1 ${isLow ? 'text-destructive' : 'text-success'}`}>
              {product.stock} {product.unit} qalıb
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isLow ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'
            }`}
          >
            <CategoryIcon cat={product.category} className="w-5 h-5" />
          </div>
        </div>

        {/* Sürətli stok dəyişmə */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={() => handleAdjust(-1)}
            disabled={busy || product.stock <= 0}
            title="Stokdan 1 çıx"
            className="w-8 h-8 rounded-lg bg-secondary text-foreground hover:bg-muted disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 bg-secondary rounded-full h-1.5">
            {product.minStock > 0 && (
              <div
                className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (product.stock / (product.minStock * 4)) * 100)}%` }}
              />
            )}
          </div>
          <button
            onClick={() => handleAdjust(1)}
            disabled={busy}
            title="Stoka 1 əlavə et"
            className="w-8 h-8 rounded-lg bg-secondary text-foreground hover:bg-muted disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Redaktə modalı */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-premium border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-extrabold flex items-center gap-2">
                ✏️ Məhsulu Redaktə Et
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 bg-secondary text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="mb-4 text-sm font-bold text-destructive">{error}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Məhsulun / Xidmətin Adı</label>
                <input required name="name" type="text" defaultValue={product.name} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Kateqoriya</label>
                  <select required name="category" defaultValue={product.category} className={inputCls}>
                    <option value="Dərman">Dərman</option>
                    <option value="Xidmət">Xidmət</option>
                    <option value="Yem">Yem</option>
                    <option value="Ləvazimat">Ləvazimat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Satış Qiyməti (₼)</label>
                  <input required name="price" type="number" step="0.01" min="0" defaultValue={product.price} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Mövcud Stok</label>
                  <input required name="stock" type="number" min="0" defaultValue={product.stock} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Kritik Hədd</label>
                  <input required name="minStock" type="number" min="0" defaultValue={product.minStock} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Ölçü vahidi</label>
                  <input required name="unit" type="text" defaultValue={product.unit} className={inputCls} />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-4 py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl shadow-glow hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Dəyişiklikləri Yadda Saxla'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Silmə təsdiqi */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 md:p-8 shadow-premium border border-border">
            <h2 className="text-lg font-display font-extrabold mb-2">Məhsulu silmək istəyirsiniz?</h2>
            <p className="text-sm text-muted-foreground font-medium mb-6">
              <b className="text-foreground">{product.name}</b> anbardan tamamilə silinəcək. Bu geri qaytarıla bilməz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 py-3 bg-destructive text-destructive-foreground font-bold text-sm rounded-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Bəli, Sil</>}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="px-5 py-3 bg-secondary hover:bg-muted text-foreground font-bold text-sm rounded-xl transition-all border border-border"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
