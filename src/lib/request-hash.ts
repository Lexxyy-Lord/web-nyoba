import { createHash } from "node:crypto";
export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function hashObject(value: unknown) {
  return hashValue(JSON.stringify(value));
}
