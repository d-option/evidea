import { NextResponse } from "next/server";
import { corsHeaders, corsOptionsResponse } from "@/app/api/_cors";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  console.log("[ping] GET", url.pathname);
  return NextResponse.json({ ok: true, method: "GET" }, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  console.log("[ping] POST", url.pathname);
  return NextResponse.json({ ok: true, method: "POST" }, { headers: corsHeaders });
}

