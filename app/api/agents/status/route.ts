import { NextRequest, NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents/registry";
import { agentAuth, readRuns, unauthorized } from "@/lib/agents/common";

export const dynamic = "force-dynamic";

/** 7 agents + unka last-run summary. Gate: CRON_SECRET ya owner cookie. */
export async function GET(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();
  const runs = await readRuns();
  return NextResponse.json({
    agents: AGENTS,
    runs,
    meta: {
      at: new Date().toISOString(),
      cronSecretSet: !!process.env.CRON_SECRET,
      note: "Live = asal me kaam karta hai · Coming soon = planned, abhi nahi.",
    },
  });
}
