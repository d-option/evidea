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

    await prisma.addToCartLog.create({
      data: {
        user: user || null,
        product: product || null,
        action,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

