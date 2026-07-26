# OTPMarket

Website SaaS nomor virtual dan penerimaan OTP berbasis Next.js App Router, TypeScript, Prisma PostgreSQL, dan API RumahOTP. Aplikasi memisahkan seluruh komunikasi provider dari browser, menghitung harga di server, menyimpan uang sebagai `BigInt`, serta mencatat setiap perubahan saldo dalam ledger.

> RumahOTP hanya digunakan sebagai provider API. Nama, logo, warna, deskripsi, favicon, dan kontak aplikasi dapat diganti melalui pengaturan admin. Deposit pengguna selalu diarahkan ke WhatsApp super admin `+62 821-4121-8134`.

## Fitur utama

- Landing page responsif, login, registrasi, lupa/reset password.
- Session database dengan cookie `HttpOnly`, `Secure` production, `SameSite=Lax`.
- Dashboard user: saldo, statistik, beli nomor, order aktif, OTP, history, ledger, deposit, notifikasi, profil, keamanan.
- Dashboard admin: user, saldo, order, deposit, pricing, provider, laporan, log API, audit log, notifikasi, pengaturan.
- Integrasi RumahOTP: balance, services, countries, operators, create/check/set-status order.
- Mock mode yang tidak memanggil RumahOTP asli.
- Pricing fixed, percentage, combined, min/max, dan pembulatan.
- Ledger atomik, optimistic concurrency, idempotency order, refund satu kali.
- Polling provider melalui endpoint worker terpusat.
- Tailwind CSS, komponen shadcn-style, Lucide, Recharts-ready, dark/light mode.

## Teknologi

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS 4 dan source components bergaya shadcn/ui
- Prisma ORM + PostgreSQL
- Argon2id, Zod, React Hook Form, Sonner
- Vitest dan Playwright

## Struktur

```text
src/app                 halaman dan route handler
src/components          komponen UI reusable
src/lib/auth            password, session, captcha, email
src/lib/rumahotp        client, types, mock, rate limiter, status mapper
src/services            transaksi order dan deposit
prisma/schema.prisma    desain database
prisma/seed.ts          role, super admin, setting, pricing default
tests                   unit, integration, e2e
docs                    instalasi, deployment, keamanan, database, testing
```

## Instalasi

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Konfigurasi RumahOTP

```env
RUMAHOTP_BASE_URL=https://www.rumahotp.io/api
RUMAHOTP_API_KEY=isi_key_asli_di_server
RUMAHOTP_MOCK_MODE=true
RUMAHOTP_MAX_REQUESTS=5
RUMAHOTP_RATE_WINDOW_MS=10000
```

Gunakan `RUMAHOTP_MOCK_MODE=true` untuk development dan test. Ubah ke `false` hanya setelah API key, whitelist IP, izin endpoint, dan saldo provider siap.

## Keuntungan

Fallback awal:

```env
OTP_DEFAULT_PROFIT=10000
OTP_PRICE_ROUNDING=100
OTP_MIN_SELLING_PRICE=0
```

Prioritas rule: `SERVICE` → `COUNTRY` → `PROVIDER` → `GLOBAL` → `.env`. Harga selalu dihitung ulang dari harga provider terbaru saat checkout dan snapshot `costPrice`, `profitAmount`, `sellingPrice` disimpan pada order.

## Seed super admin

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_USERNAME=superadmin
SEED_ADMIN_PASSWORD=ChangeMe123!
```

Jalankan `npm run db:seed`, lalu segera ganti password.

## Production

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run start
```

Standalone:

```bash
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

## Worker polling

Jalankan scheduler eksternal setiap 5–10 detik, tetapi jangan melebihi batas global provider:

```bash
curl -X POST https://domain.example/api/internal/poll-orders \
  -H "x-worker-secret: $WORKER_SECRET"
```

Untuk multi-instance, ganti rate limiter in-memory dengan Redis/BullMQ agar batas 5 request per 10 detik berlaku lintas proses.

## Backup PostgreSQL

```bash
pg_dump "$DATABASE_URL" --format=custom --file=otpmarket-$(date +%F).dump
```

Dokumentasi tambahan tersedia di `docs/`.
