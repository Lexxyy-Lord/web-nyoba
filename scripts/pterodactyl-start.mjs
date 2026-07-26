import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const serverFile = path.join(root, ".next", "standalone", "server.js");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

if (process.env.RUN_DB_MIGRATIONS === "true") {
  console.log("Running Prisma production migrations...");
  run("npm", ["run", "db:migrate"]);
}

if (!(await exists(serverFile))) {
  if (process.env.AUTO_BUILD_ON_START === "false") {
    console.error("Production build tidak ditemukan. Jalankan npm run build terlebih dahulu.");
    process.exit(1);
  }

  console.log("Production build tidak ditemukan. Building OTPMarket...");
  run("npm", ["run", "build"]);
}

console.log(`Starting OTPMarket on ${process.env.HOSTNAME}:${process.env.PORT}`);
run(process.execPath, [serverFile]);
