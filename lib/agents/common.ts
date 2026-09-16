import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";

const REPO = "raj3kk/mera-ai";
const RUNS_PATH = "data/agent-runs.json";

export interface RunRecord {
  at: string;
  ok: boolean;
  summary: string;
  detail?: unknown;
}

/**
 * Agent auth: Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET`
 * (jab CRON_SECRET env var project me set ho). Manual runs ke liye owner cookie
 * bhi chalti hai (dashboard se "Run now"). Dono nahi → 401.
 */
export function agentAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth === `Bearer ${secret}`) return true;
    if (req.headers.get("x-cron-secret") === secret) return true;
    const q = req.nextUrl.searchParams.get("secret");
    if (q && q === secret) return true;
  }
  try {
    return isOwner();
  } catch {
    return false;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized — CRON_SECRET ya owner login chahiye." },
    { status: 401 }
  );
}

/** Promise ko time-bound karo — Hobby ke ~10s function timeout ke andar rehna hai. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (t) clearTimeout(t);
  });
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mera-ai",
  };
  if (process.env.GH_TOKEN) h.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  return h;
}

async function readRunsFile(): Promise<{ runs: Record<string, RunRecord>; sha?: string }> {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${RUNS_PATH}`, {
      headers: ghHeaders(),
      cache: "no-store",
    });
    if (!r.ok) return { runs: {} };
    const j = await r.json();
    const runs =
      JSON.parse(Buffer.from(j.content || "", "base64").toString("utf8")).runs ?? {};
    return { runs, sha: j.sha as string };
  } catch {
    return { runs: {} };
  }
}

export async function readRuns(): Promise<Record<string, RunRecord>> {
  return (await readRunsFile()).runs;
}

/**
 * Last-run summaries repo me persist karo — single read-modify-write.
 * Commit me [skip ci] taaki Vercel deploy trigger na ho (deployment budget bachao).
 * GH_TOKEN nahi hai to silently skip (best-effort).
 */
export async function recordRuns(
  entries: Record<string, Omit<RunRecord, "at">>
): Promise<void> {
  if (!process.env.GH_TOKEN) return;
  try {
    const { runs, sha } = await readRunsFile();
    const at = new Date().toISOString();
    for (const [k, v] of Object.entries(entries)) runs[k] = { at, ...v };
    const content = Buffer.from(JSON.stringify({ runs }, null, 1)).toString("base64");
    const body: Record<string, string> = {
      message: "chore: agent run records [skip ci]",
      content,
    };
    if (sha) body.sha = sha;
    await fetch(`https://api.github.com/repos/${REPO}/contents/${RUNS_PATH}`, {
      method: "PUT",
      headers: { ...ghHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* persistence best-effort hai — run ka result phir bhi return hota hai */
  }
}

export async function recordRun(
  agent: string,
  entry: Omit<RunRecord, "at">
): Promise<void> {
  return recordRuns({ [agent]: entry });
}
