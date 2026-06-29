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
  await prisma.invoice.update({ where: { id }, data: { status } })
  revalidatePath('/invoices')
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
