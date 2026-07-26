import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === "bigint" ? item.toString() : item))) as T;
}

export function createReference(prefix: string) {
  const now = new Date();
  const stamp = now.toISOString().replace(/\D/g, "").slice(0, 14);
  return `${prefix}${stamp}${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
