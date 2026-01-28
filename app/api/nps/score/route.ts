import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders, corsOptionsResponse } from "@/app/api/_cors";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];

export async function OPTIONS() {
  return corsOptionsResponse();
}

type NpsScorePayload = {
  nps_score?: string | number;
  nps_transaction_id?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NpsScorePayload;
    const transactionId = body.nps_transaction_id;
    const score = Number(body.nps_score);

    if (!transactionId || Number.isNaN(score)) {
      return NextResponse.json(
        { error: "invalid_payload" },
        { status: 400, headers: corsHeaders }
      );
    }

    const created = await prisma.npsVote.create({
      data: {
        transactionId,
        score: Math.trunc(score),
        note: null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

