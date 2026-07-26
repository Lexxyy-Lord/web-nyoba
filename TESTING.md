# Testing

```bash
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

Test unit mencakup format Rupiah, fixed/percentage/combined profit, rounding, rule priority, dan status mapper. Integration test memverifikasi ledger, insufficient balance, refund idempotency, serta deposit credit satu kali melalui repository mock. E2E memakai route interception dan mock mode sehingga tidak memanggil RumahOTP asli.
