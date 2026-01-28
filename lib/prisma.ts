import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function buildRuntimeDatabaseUrl(): string | undefined {
  // Vercel Neon integration genelde hem pooled hem non-pooled URL verir.
  // Runtime'da (serverless) pooler bazen timeout/reset üretebildiği için
  // mümkünse non-pooling URL'yi tercih ediyoruz.
  const raw =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!raw) return undefined;

  // Eğer pooler kullanılıyorsa (fallback), pgbouncer parametresini güvenceye al.
  try {
    const u = new URL(raw);
    const isPooler = u.hostname.includes("-pooler.");
    if (isPooler) {
      if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit"))
        u.searchParams.set("connection_limit", "1");
    }
    return u.toString();
  } catch {
    return raw;
  }
}

const runtimeDbUrl = buildRuntimeDatabaseUrl();

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    datasources: runtimeDbUrl ? { db: { url: runtimeDbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

