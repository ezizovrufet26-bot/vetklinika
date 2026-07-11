import { prisma } from '@/lib/prisma'
import { AlertTriangle, Pill, HeartHandshake, Beef, Package } from 'lucide-react'
import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'

import InventoryManagerModal from '@/components/InventoryManagerModal'
import InventoryProductCard from '@/components/InventoryProductCard'

export const dynamic = 'force-dynamic'

// Seed default products if none exist
async function ensureSeedProducts() {
  const count = await prisma.product.count()
  if (count === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Ümumi Müayinə',        category: 'Xidmət',   price: 15,  stock: 999, minStock: 0, unit: 'dəfə' },
        { name: 'Peyvənd (kombine)',     category: 'Dərman',   price: 25,  stock: 50,  minStock: 5, unit: 'doza' },
        { name: 'Qan analizi',           category: 'Xidmət',   price: 30,  stock: 999, minStock: 0, unit: 'dəfə' },
        { name: 'UZİ müayinəsi',         category: 'Xidmət',   price: 40,  stock: 999, minStock: 0, unit: 'dəfə' },
        { name: 'Antiparazit dərman',    category: 'Dərman',   price: 12,  stock: 30,  minStock: 5, unit: 'ədəd' },
        { name: 'Gənə əleyhinə damla',   category: 'Dərman',   price: 18,  stock: 25,  minStock: 5, unit: 'ədəd' },
        { name: 'Antibiotik kursu',      category: 'Dərman',   price: 35,  stock: 20,  minStock: 5, unit: 'kurs' },
        { name: 'Vitaminlər',            category: 'Dərman',   price: 20,  stock: 40,  minStock: 10, unit: 'qutu' },
        { name: 'Cərrahi əməliyyat',     category: 'Xidmət',   price: 150, stock: 999, minStock: 0, unit: 'dəfə' },
        { name: 'Diş təmizlənməsi',      category: 'Xidmət',   price: 50,  stock: 999, minStock: 0, unit: 'dəfə' },
        { name: 'Premium it yemi (1kq)', category: 'Yem',      price: 22,  stock: 15,  minStock: 5, unit: 'kq'   },
        { name: 'Premium pişik yemi',    category: 'Yem',      price: 18,  stock: 12,  minStock: 5, unit: 'kq'   },
      ]
    })
  }
}

const CategoryIcon = ({ cat, className }: { cat: string; className?: string }) => {
  if (cat === 'Xidmət') return <HeartHandshake className={className} />
  if (cat === 'Dərman') return <Pill className={className} />
  if (cat === 'Yem') return <Beef className={className} />
  return <Package className={className} />
}

export default async function InventoryPage() {
  await ensureSeedProducts()
  const products = await prisma.product.findMany({ orderBy: { category: 'asc' } })

  const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0)
  const categories = [...new Set(products.map(p => p.category))]

  return (
    <AppShell>
      <PageHeader
        title="Anbar &"
        highlight="İnventar"
        subtitle="Dərman, xidmət və yem stoku — kritik həddə düşəndə avtomatik xəbərdarlıq"
        actions={
          <div className="flex items-center gap-4">
            <InventoryManagerModal />
            <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-center shadow-soft">
              <p className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">Məhsul</p>
              <p className="text-xl font-display font-extrabold">{products.length}</p>
            </div>
            {lowStock.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/25 px-5 py-2.5 rounded-xl text-center shadow-soft animate-pulse-subtle">
                <p className="text-destructive text-[10px] font-extrabold uppercase tracking-wider">Az Stok</p>
                <p className="text-xl font-display font-extrabold text-destructive">{lowStock.length}</p>
              </div>
            )}
          </div>
        }
      />

      {/* Kritik stok xəbərdarlığı */}
      {lowStock.length > 0 && (
        <div className="mb-8 bg-destructive/5 border border-destructive/25 rounded-2xl p-5 flex items-start gap-4">
          <span className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <p className="font-display font-extrabold text-destructive">Kritik Stok Xəbərdarlığı</p>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Bu məhsulların stoku azalıb: <b className="text-foreground">{lowStock.map(p => p.name).join(', ')}</b>
            </p>
          </div>
        </div>
      )}

      {/* Kateqoriyalar üzrə məhsullar */}
      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-display font-extrabold mb-3 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <CategoryIcon cat={cat} className="w-4 h-4" />
            </span>
            {cat}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.filter(p => p.category === cat).map(product => (
              <InventoryProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ))}
    </AppShell>
  )
}
