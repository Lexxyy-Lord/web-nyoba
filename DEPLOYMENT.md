# Deployment Pterodactyl

## Build biasa

Startup command:

```bash
npm run start
```

Variabel panel:

```env
NODE_ENV=production
PORT=<port_yang_diberikan_panel>
HOSTNAME=0.0.0.0
```

Install/build command:

```bash
npm install --omit=dev=false
npm run db:generate
npm run db:migrate
npm run build
```

## Standalone

Next.js memakai `output: "standalone"`. Setelah build, salin aset berikut bila deployment dipisah:

```bash
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
```

Startup:

```bash
node .next/standalone/server.js
```

Aplikasi membaca `PORT` dan `HOSTNAME`; port tidak di-hard-code.

## Worker

Buat scheduled task/curl ke `/api/internal/poll-orders` dengan header `x-worker-secret`. Satu worker saja untuk satu database kecuali rate limiter dipindahkan ke Redis.
