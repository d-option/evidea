const { spawnSync } = require("node:child_process");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Vercel/Prod: schema.prisma Postgres env’leri set ise migrate deploy çalıştır.
// Local/dev: Postgres env yoksa build’i bloklamasın (SQLite akışı ayrı şema ile yönetiliyor).
const hasPostgres =
  !!process.env.POSTGRES_PRISMA_URL || !!process.env.POSTGRES_URL_NON_POOLING;

if (!hasPostgres) {
  console.log("[migrate] POSTGRES_* env yok -> migrate deploy atlandı.");
  process.exit(0);
}

console.log("[migrate] Postgres env bulundu -> prisma migrate deploy çalıştırılıyor...");
run("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]);

