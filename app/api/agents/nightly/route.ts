import { NextRequest, NextResponse } from "next/server";
import {
  agentAuth,
  recordRuns,
  unauthorized,
  withTimeout,
  type RunRecord,
} from "@/lib/agents/common";
import { monitorCheck, doctorCheck, backendCheck, guardSweep } from "@/lib/agents/checks";

export const dynamic = "force-dynamic";

/**
 * Daily cron (vercel.json) — 4 checks parallel me, har ek ~7s cap ke saath,
 * taaki Hobby ke function timeout ke andar rahe. Results ek hi commit me
 * data/agent-runs.json me record hote hain ([skip ci] — no redeploy).
 *
 * Vercel Cron automatically `Authorization: Bearer $CRON_SECRET` bhejta hai.
 */
export async function GET(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();

  const settled = await Promise.allSettled([
    withTimeout(monitorCheck(), 7000).then((r) => ({ id: "monitor", ...r })),
    withTimeout(doctorCheck(), 7000).then((r) => ({ id: "doctor", ...r })),
    withTimeout(backendCheck(), 7000).then((r) => ({ id: "backend", ...r })),
    withTimeout(guardSweep(), 7000).then((r) => ({ id: "guard", ...r })),
  ]);

  const entries: Record<string, Omit<RunRecord, "at">> = {};
  for (const s of settled) {
    if (s.status === "fulfilled") {
      const { id, ...rest } = s.value;
      entries[id] = rest;
    }
  }
  for (const id of ["monitor", "doctor", "backend", "guard"]) {
    if (!entries[id]) {
      entries[id] = { ok: false, summary: `${id}: timed out (>7s) — agle run me retry hoga.` };
    }
  }
  const allOk = Object.values(entries).every((e) => e.ok);
  entries["nightly"] = {
    ok: allOk,
    summary: allOk
      ? "All nightly checks passed."
      : "Kuch checks me dhyan chahiye — dashboard → Agents tab dekho.",
  };

  await recordRuns(entries);
  return NextResponse.json({ ok: allOk, checks: entries });
}
