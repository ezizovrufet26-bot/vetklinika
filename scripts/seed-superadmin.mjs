/**
 * SuperAdmin (yaradıcı) hesabını yaradır və ya yeniləyir.
 *
 * İstifadə (parol heç vaxt kodda saxlanmır, env ilə ötürülür):
 *   SEED_NAME="Ad Soyad" SEED_EMAIL="a@b.com" SEED_PHONE="+994..." SEED_PASSWORD="..." node scripts/seed-superadmin.mjs
 *
 * DATABASE_URL .env-dən oxunur (dotenv transitiv mövcuddur; yoxdursa env-i özünüz ötürün).
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { SEED_NAME, SEED_EMAIL, SEED_PHONE, SEED_PASSWORD } = process.env

if (!SEED_EMAIL || !SEED_PASSWORD) {
  console.error('SEED_EMAIL və SEED_PASSWORD env dəyişənləri tələb olunur.')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL tapılmadı.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12)

// Default klinika (yoxdursa yaradılır)
let clinic = await prisma.clinic.findFirst()
if (!clinic) {
  clinic = await prisma.clinic.create({ data: { name: 'VetKlinika Mərkəz' } })
  console.log('Klinika yaradıldı:', clinic.name)
}

const email = SEED_EMAIL.toLowerCase()
const existing = await prisma.user.findFirst({ where: { email } })

if (existing) {
  await prisma.user.update({
    where: { id: existing.id },
    data: {
      name: SEED_NAME || existing.name,
      phone: SEED_PHONE || existing.phone,
      passwordHash,
      role: 'SUPERADMIN',
      isActive: true,
      clinicId: clinic.id,
    },
  })
  console.log('SuperAdmin yeniləndi:', email)
} else {
  await prisma.user.create({
    data: {
      name: SEED_NAME || 'SuperAdmin',
      email,
      phone: SEED_PHONE || null,
      passwordHash,
      role: 'SUPERADMIN',
      isActive: true,
      clinicId: clinic.id,
    },
  })
  console.log('SuperAdmin yaradıldı:', email)
}

await prisma.$disconnect()
await pool.end()
console.log('Hazır. /login səhifəsindən daxil ola bilərsiniz.')
