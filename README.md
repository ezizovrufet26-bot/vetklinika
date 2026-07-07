# VetKlinika

Baytarlıq klinikası idarəetmə sistemi: xəstə qeydiyyatı, təqvim, hesab-faktura,
anbar, laboratoriya, analitika və WhatsApp AI Resepşn — hamısı bir yerdə.

**Stack:** Next.js 16 · React 19 · Tailwind v4 · Prisma 7 · Supabase (PostgreSQL) ·
Cloudinary (media) · Baileys (WhatsApp) · Vercel (app) + Railway (WhatsApp gateway)

## Yerli quraşdırma

```bash
npm install          # asılılıqlar + prisma generate (postinstall)
npm run dev          # http://localhost:3000
```

`.env` faylı (repoya heç vaxt commit edilmir):

```
DATABASE_URL=postgresql://...   # Supabase pooler connection string
AUTH_SECRET=...                 # sessiya JWT imza açarı (uzun random string)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
APP_URL=https://...             # WhatsApp gateway-in webhook hədəfi
```

`AUTH_SECRET` yoxdursa sessiya açarı `DATABASE_URL`-dən törədilir — işləyir,
amma DB parolu rotasiya olunanda bütün girişlər sıfırlanır. Ayrıca açar təyin edin.

## Verilənlər bazası

```bash
npx prisma db push                 # sxemi Supabase-ə tətbiq et
npx prisma studio                  # verilənlərə baxış
```

İlk SUPERADMIN hesabı (parol heç vaxt kodda/repoda saxlanmır):

```bash
SEED_NAME="Ad Soyad" SEED_EMAIL="siz@example.com" \
SEED_PHONE="+994xxxxxxxxx" SEED_PASSWORD="..." \
node scripts/seed-superadmin.mjs
```

## Auth arxitekturası

- HttpOnly cookie içində HS256 JWT (`src/lib/auth.ts`, edge-safe)
- Marşrut qoruması `src/middleware.ts`-də: `/` və `/login` ictimai,
  `/api/whatsapp/*` və `/api/cron/*` xarici servislər üçün açıq, qalan hər şey sessiya tələb edir
- Rollar: `SUPERADMIN` → `ADMIN` → `DOCTOR` → `STAFF`
- Giriş email və ya telefon (+994 normallaşdırılır) + parol ilə

## WhatsApp gateway

Railway-də ayrıca uzunmüddətli proses kimi işləyir:

```bash
node whatsapp-gateway.mjs   # Baileys sessiyası baileys_auth_info/-da (gitignored)
```

- İlk işə salmada terminala QR kod çıxır — WhatsApp-dan skan edin
- Gələn mesajları `APP_URL/api/whatsapp/webhook`-a ötürür
- Deploy konfiqi: `railway.json` + `nixpacks.toml` (Node 22)

## Deploy

- **App (Vercel):** `master` branch-inə push → avtomatik build.
  Build `DATABASE_URL`-siz də keçir (lazy Prisma init), amma runtime üçün
  yuxarıdakı env dəyişənləri Vercel-də təyin olunmalıdır.
- **Gateway (Railway):** eyni repo, `node whatsapp-gateway.mjs` start əmri ilə.
- **CI:** `.github/workflows/build-check.yml` hər push-da Linux build yoxlayır,
  uğursuzluqda avtomatik issue açır.

## Qovluq xəritəsi

```
src/app/            # Next.js App Router səhifələri
  actions/          # server actions (auth, calendar, communications, ...)
  api/              # webhook, cron, realtime endpoint-lər
src/components/     # AppShell + UI kit (button, card, badge, stat-card, motion)
src/lib/            # auth.ts (JWT), session.ts, prisma client
prisma/             # schema (14 model: Clinic, User, Patient, Visit, Invoice, ...)
scripts/            # seed-superadmin.mjs və s.
whatsapp-gateway.mjs # Railway-də işləyən Baileys prosesi
```

## Qeydlər

- `public/uploads/` gitignored-dur — istifadəçi məlumatı repoya düşməməlidir
- SKILL/agent qovluğu `.agents/` da gitignored-dur
