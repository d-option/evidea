#!/usr/bin/env bash
set -euo pipefail

echo "[vercel-build] Running Prisma migrations (Postgres) ..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "[vercel-build] Building Next.js ..."
npm run build

