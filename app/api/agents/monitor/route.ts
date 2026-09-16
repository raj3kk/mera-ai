import { NextRequest, NextResponse } from "next/server";
import { agentAuth, recordRun, unauthorized, withTimeout } from "@/lib/agents/common";
import { monitorCheck } from "@/lib/agents/checks";

export const dynamic = "force-dynamic";

/** Monitor on-demand — platform uptime check. */
export async function GET(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();
  const r = await withTimeout(monitorCheck(), 25000);
  await recordRun("monitor", r);
  return NextResponse.json(r);
}
