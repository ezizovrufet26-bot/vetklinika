import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { createProduct } from '@/app/actions/billing'

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

export default async function InventoryPage() {
  await ensureSeedProducts()
  const products = await prisma.product.findMany({ orderBy: { category: 'asc' } })

  const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0)
  const categories = [...new Set(products.map(p => p.category))]

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-br from-amber-800 via-orange-900 to-red-900 rounded-b-[4rem] -z-10 shadow-2xl overflow-hidden">
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
                Anbar & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-200">İnventar</span>
              </h1>
            </div>
            <p className="text-amber-100/80 text-sm font-medium tracking-wide ml-14">EzyVet rəqibi səviyyəsində stok idarəetməsi</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-amber-200/80 text-xs font-bold uppercase tracking-wider">Məhsul</p>
              <p className="text-2xl font-black text-white">{products.length}</p>
            </div>
            {lowStock.length > 0 && (
              <div className="bg-red-500/30 backdrop-blur-md border border-red-500/40 px-5 py-3 rounded-2xl text-center shadow-xl animate-pulse">
                <p className="text-red-200/80 text-xs font-bold uppercase tracking-wider">⚠️ Az Stok</p>
                <p className="text-2xl font-black text-red-300">{lowStock.length}</p>
              </div>
            )}
          </div>
        </header>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <p className="font-black text-red-800 text-lg">Kritik Stok Xəbərdarlığı!</p>
              <p className="text-red-600 text-sm mt-1">Bu məhsulların stoku azalıb: <b>{lowStock.map(p => p.name).join(', ')}</b></p>
            </div>
          </div>
        )}

        {/* Products by Category */}
        {categories.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="text-lg font-black text-slate-700 mb-3 flex items-center gap-2">
              {cat === 'Xidmət' ? '🏥' : cat === 'Dərman' ? '💊' : cat === 'Yem' ? '🍖' : '🔧'} {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.filter(p => p.category === cat).map(product => {
                const isLow = product.stock <= product.minStock && product.minStock > 0
                return (
                  <div key={product.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 ${isLow ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{product.name}</h3>
                      {isLow && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold">AZ!</span>}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-black text-slate-800">{product.price} <span className="text-sm font-normal text-slate-500">₼</span></p>
                        <p className={`text-sm font-semibold mt-1 ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                          {product.stock} {product.unit} qalıb
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isLow ? 'bg-red-100' : 'bg-slate-100'}`}>
                        {cat === 'Xidmət' ? '🏥' : cat === 'Dərman' ? '💊' : cat === 'Yem' ? '🍖' : '📦'}
                      </div>
                    </div>
                    {product.minStock > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (product.stock / (product.minStock * 4)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
