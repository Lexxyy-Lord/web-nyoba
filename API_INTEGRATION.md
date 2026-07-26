# Integrasi RumahOTP

## Endpoint OTP yang dipakai

- `GET /v1/user/balance`
- `GET /v2/services`
- `GET /v2/countries?service_id=`
- `GET /v2/operators?country=&provider_id=`
- `GET /v2/orders?number_id=&provider_id=&operator_id=`
- `GET /v1/orders/get_status?order_id=`
- `GET /v1/orders/set_status?order_id=&status=cancel|done|resend`

Header autentikasi adalah `x-apikey`. API key hanya dibaca di server. Client memeriksa `success`; ketika `false`, pesan diambil dari `error.message`.

## Batas provider

Dokumentasi menyebut 5 request per 10 detik. `src/lib/rumahotp/rate-limiter.ts` menerapkan queue global per proses. Untuk deployment multi-process/multi-node wajib memakai distributed limiter.

## Deposit

Walaupun dokumentasi menyediakan endpoint deposit RumahOTP, proyek ini sengaja tidak menggunakannya untuk deposit user. Sesuai kebutuhan bisnis, deposit selalu dibuat sebagai permintaan internal dan diarahkan ke WhatsApp super admin `6282141218134`. Admin menambahkan saldo setelah verifikasi pembayaran.

## Mock mode

`RUMAHOTP_MOCK_MODE=true` menyediakan layanan, negara, operator, order, OTP, cancel, dan saldo mock tanpa transaksi provider asli.
