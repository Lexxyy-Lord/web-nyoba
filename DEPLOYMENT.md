# Deployment OTPMarket

## Build production

```bash
npm install
npm run db:generate
npm run build
```

Build memakai `output: "standalone"`. Script build juga menyalin `.next/static` dan folder `public` (bila tersedia) ke `.next/standalone` agar aset tetap dapat diakses.

## Pterodactyl Node.js

Gunakan image Node.js 20 atau lebih baru. Node.js 22 LTS direkomendasikan.

### Startup command

```bash
npm run start
```

Startup tersebut:

1. Menggunakan `PORT` yang diberikan panel.
2. Bind ke `HOSTNAME=0.0.0.0`.
3. Menjalankan build otomatis bila `.next/standalone/server.js` belum tersedia, kecuali `AUTO_BUILD_ON_START=false`.
4. Menjalankan `prisma migrate deploy` lebih dahulu bila `RUN_DB_MIGRATIONS=true`.
5. Menjalankan server standalone Next.js sebagai proses Node.js utama.

### Variabel minimum

```env
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/otpmarket?schema=public
APP_URL=https://domain-anda.example
RUMAHOTP_API_KEY=
RUMAHOTP_MOCK_MODE=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_USERNAME=superadmin
SEED_ADMIN_PASSWORD=ganti-password-kuat
AUTO_BUILD_ON_START=true
RUN_DB_MIGRATIONS=true
```

Gunakan port allocation dari panel untuk `PORT`. Jangan hard-code port publik ke source.

## Instalasi pertama di panel

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm run start
```

Setelah instalasi pertama, startup harian cukup:

```bash
npm run start
```

## Worker pemeriksaan OTP

Jalankan scheduled task atau cron yang memanggil:

```text
POST /api/internal/poll-orders
x-worker-secret: nilai_WORKER_SECRET
```

Gunakan satu worker untuk satu database selama rate limiter masih berada di memory proses. Batas RumahOTP tetap 5 request per 10 detik secara global.

Deposit user tetap diarahkan ke WhatsApp super admin `6282141218134`. API key RumahOTP hanya disimpan di environment server.
