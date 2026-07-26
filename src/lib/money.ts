export function formatRupiah(value: bigint | number | string) {
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function parseRupiah(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? BigInt(digits) : 0n;
}

export function roundMoney(value: bigint, increment: number) {
  if (increment <= 1) return value;
  const step = BigInt(increment);
  return ((value + step - 1n) / step) * step;
}
