import { NextRequest, NextResponse } from "next/server";
import { agentAuth, recordRun, unauthorized, withTimeout } from "@/lib/agents/common";
import { backendCheck } from "@/lib/agents/checks";

export const dynamic = "force-dynamic";

/** Backend on-demand — Supabase health (read-only). */
export async function GET(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();
  const r = await withTimeout(backendCheck(), 25000);
  await recordRun("backend", r);
  return NextResponse.json(r);
}
