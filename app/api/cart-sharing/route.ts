import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders, corsOptionsResponse } from "@/app/api/_cors";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];

export async function OPTIONS() {
  return corsOptionsResponse();
}

type CartSharingCreatePayload = {
  basket?: { name?: string };
  products?: unknown[];
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CartSharingCreatePayload;

    if (!Array.isArray(body.products)) {
      return NextResponse.json(
        { error: "products must be an array" },
        { status: 400, headers: corsHeaders }
      );
    }

    const created = await prisma.cartShare.create({
      data: {
        basketName: body.basket?.name ?? null,
        products: JSON.stringify(body.products),
        userId: body.userId ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

