'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ── Invoice ──────────────────────────────────────────────
export async function getInvoices() {
  return await prisma.invoice.findMany({
    include: { patient: { include: { owner: true } }, items: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createInvoice(data: {
  patientId: string
  items: { name: string; quantity: number; unitPrice: number }[]
  notes?: string
}) {
  // Auto invoice number: QBZ-001
  const count = await prisma.invoice.count()
  const invoiceNo = `QBZ-${String(count + 1).padStart(3, '0')}`
  const totalAmount = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  await prisma.invoice.create({
    data: {
      invoiceNo,
      totalAmount,
      notes: data.notes,
      patientId: data.patientId,
      items: {
        create: data.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice
        }))
      }
    }
  })
  revalidatePath('/invoices')
}

export async function updateInvoiceStatus(id: string, status: 'UNPAID' | 'PAID' | 'PARTIAL') {
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status },
    include: { items: true }
  })

  // If paid, auto-deduct matching items from inventory stock
  if (status === 'PAID' && invoice.items.length > 0) {
    for (const item of invoice.items) {
      const product = await prisma.product.findFirst({
        where: { name: { contains: item.name, mode: 'insensitive' } }
      })
      if (product && product.stock > 0) {
        const newStock = Math.max(0, product.stock - item.quantity)
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: newStock }
        })
      }
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/inventory')
}

// ── Products / Inventory ──────────────────────────────────
export async function getProducts() {
  return await prisma.product.findMany({ orderBy: { category: 'asc' } })
}

export async function createProduct(data: {
  name: string; category: string; price: number; stock: number; minStock: number; unit: string
}) {
  await prisma.product.create({ data })
  revalidatePath('/inventory')
}

export async function updateProductStock(id: string, stock: number) {
  await prisma.product.update({ where: { id }, data: { stock } })
  revalidatePath('/inventory')
}

export async function updateProduct(id: string, data: {
  name: string; category: string; price: number; stock: number; minStock: number; unit: string
}) {
  if (!data.name?.trim()) return { error: 'Ad boş ola bilməz.' }
  if (data.price < 0 || data.stock < 0 || data.minStock < 0) {
    return { error: 'Qiymət/stok mənfi ola bilməz.' }
  }
  await prisma.product.update({ where: { id }, data })
  revalidatePath('/inventory')
  return { success: true }
}

/** Mövcud stoka əlavə/çıxma edir (mənfi delta ilə azaldır) — sıfırın altına düşmür. */
export async function adjustProductStock(id: string, delta: number) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return { error: 'Məhsul tapılmadı.' }
  const newStock = Math.max(0, product.stock + delta)
  await prisma.product.update({ where: { id }, data: { stock: newStock } })
  revalidatePath('/inventory')
  return { success: true, stock: newStock }
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } })
  revalidatePath('/inventory')
  return { success: true }
}
