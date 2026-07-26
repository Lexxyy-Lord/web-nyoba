# Installation

1. Gunakan Node.js 20.9 atau lebih baru dan PostgreSQL 15+.
2. Salin `.env.example` menjadi `.env`.
3. Isi `DATABASE_URL`, credential seed admin, `WORKER_SECRET`, dan konfigurasi aplikasi.
4. Jalankan:

```bash
npm install
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev
```

Untuk migrasi production gunakan `npm run db:migrate`, bukan `prisma migrate dev`.
