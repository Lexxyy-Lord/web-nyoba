# Security

- Password: Argon2id.
- Session: token acak 256-bit, hanya hash SHA-256 disimpan di DB; cookie HttpOnly, Secure production, SameSite Lax.
- CSRF: mutasi memeriksa `Origin`; form dan fetch same-origin.
- RBAC: role dari database, bukan frontend.
- Uang: `BigInt`; tidak ada floating point untuk saldo.
- Concurrency: versioned balance row + transaction `Serializable`.
- Refund: `refundedAt` dan `refundTransactionId` unik.
- Order: unique `(userId, idempotencyKey)`.
- API key tidak dikirim ke browser dan disanitasi dari log.
- Rate limit login, register, purchase, dan provider.
- Security headers: CSP, frame deny, nosniff, referrer policy, permissions policy.
- Account status diperiksa pada setiap session.
- Provider GET mutation diberi `cache: no-store` dan `Cache-Control: no-store`.

Untuk skala horizontal gunakan Redis untuk rate limit, queue worker, dan lock terdistribusi. Aktifkan HTTPS dan whitelist IP server pada RumahOTP.
