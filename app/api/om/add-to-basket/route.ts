import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders, corsOptionsResponse } from "@/app/api/_cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const user = url.searchParams.get("user");
    const product = url.searchParams.get("product");
    const action = url.searchParams.get("action") ?? "add-to-basket";

    try {
      await prisma.addToCartLog.create({
        data: {
          user: user || null,
          product: product || null,
          action,
        },
        select: { id: true },
      });
    } catch (e) {
      // Tracking endpoint: GTM akışını asla bozmasın.
      // Detayı Vercel logs üzerinden görebilmek için logla.
      console.error("[add-to-basket] DB write failed:", e);
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (e) {
    console.error("[add-to-basket] handler failed:", e);
    // Yine de 200 dönelim; bu endpoint “best-effort log” içindir.
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  }
}

