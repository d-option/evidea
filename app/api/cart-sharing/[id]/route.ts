import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders, corsOptionsResponse } from "@/app/api/_cors";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    const found = await prisma.cartShare.findUnique({
      where: { id },
      select: { id: true, basketName: true, products: true, userId: true },
    });

    if (!found) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: corsHeaders }
      );
    }

    let products: unknown[] = [];
    try {
      const parsed = JSON.parse(found.products);
      if (Array.isArray(parsed)) products = parsed;
    } catch {
      // ignore parse errors; keep empty array
    }

    return NextResponse.json(
      {
        id: found.id,
        basket: { name: found.basketName ?? null },
        products,
        userId: found.userId ?? null,
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

