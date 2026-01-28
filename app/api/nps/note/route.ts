import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders, corsOptionsResponse } from "@/app/api/_cors";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];

export async function OPTIONS() {
  return corsOptionsResponse();
}

type NpsNotePayload = {
  id?: string;
  nps_note?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NpsNotePayload;
    if (!body.id) {
      return NextResponse.json(
        { error: "missing_id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const updated = await prisma.npsVote.update({
      where: { id: body.id },
      data: { note: body.nps_note ?? null },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id }, { headers: corsHeaders });
  } catch (e: any) {
    // Prisma record not found -> P2025
    if (e?.code === "P2025") {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

