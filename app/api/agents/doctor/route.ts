import { NextRequest, NextResponse } from "next/server";
import { agentAuth, recordRun, unauthorized, withTimeout } from "@/lib/agents/common";
import { doctorCheck } from "@/lib/agents/checks";

export const dynamic = "force-dynamic";

/** Doctor on-demand — latest deploy ka health + ERROR pe diagnosis. */
export async function GET(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();
  const r = await withTimeout(doctorCheck(), 25000);
  await recordRun("doctor", r);
  return NextResponse.json(r);
}
