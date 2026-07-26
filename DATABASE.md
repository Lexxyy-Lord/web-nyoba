# Database

PostgreSQL dipilih karena transaksi, constraint, dan isolation level. Nominal Rupiah disimpan sebagai `BigInt`.

Model utama: `User`, `Role`, `Session`, `UserBalance`, `BalanceLedger`, `OtpService`, `OtpCountry`, `OtpProvider`, `OtpOperator`, `OtpOrder`, status histories, `Deposit`, `PricingRule`, `AppSetting`, `Notification`, audit/API/login logs, reset token, dan idempotency key.

`BalanceLedger` menyimpan debit, kredit, saldo sebelum/sesudah, referensi order/deposit/admin, IP, user agent, dan timestamp. `OtpOrder` menyimpan snapshot modal, keuntungan, harga jual, saldo sebelum/sesudah, status internal, dan raw provider status.
