import type { RunRecord } from "./common";

const APP_URL = process.env.APP_URL || "https://mera-ai-nu.vercel.app";

type CheckResult = Omit<RunRecord, "at">;

async function timedFetch(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

/** Monitor: platform uptime check. */
export async function monitorCheck(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const r = await timedFetch(APP_URL, 7000);
    const ms = Date.now() - t0;
    const ok = r.status < 500;
    return {
      ok,
      summary: ok ? `UP — HTTP ${r.status}, ${ms}ms` : `DOWN — HTTP ${r.status}`,
      detail: { url: APP_URL, status: r.status, ms },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return { ok: false, summary: `DOWN — ${msg}`, detail: { url: APP_URL } };
  }
}

async function vfetch(token: string, path: string) {
  const r = await fetch("https://api.vercel.com" + path, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const text = await r.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  return { status: r.status, json: json as any };
}

/** Doctor: latest production deployment ka haal + ERROR pe diagnosis. Retry cap: sirf report, auto-fix nahi. */
export async function doctorCheck(): Promise<CheckResult> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { ok: true, summary: "Idle — VERCEL_TOKEN not connected." };
  try {
    const proj = await vfetch(token, "/v9/projects/mera-ai");
    const projectId: string | undefined = proj.json?.id;
    if (!projectId) {
      return { ok: false, summary: `Vercel project lookup failed (HTTP ${proj.status}).` };
    }
    const deps = await vfetch(
      token,
      `/v6/deployments?projectId=${projectId}&limit=3&target=production`
    );
    const latest = deps.json?.deployments?.[0];
    if (!latest) return { ok: true, summary: "No production deployments found." };
    if (latest.state === "READY") {
      return {
        ok: true,
        summary: `Healthy — latest deploy READY.`,
        detail: { state: latest.state, url: latest.url },
      };
    }
    if (latest.state === "ERROR") {
      const ev = await vfetch(token, `/v6/deployments/${latest.uid}/events?limit=60`);
      const lines: string[] = [];
      for (const e of ev.json ?? []) {
        const t = String(e?.payload?.text || e?.text || "");
        if (/error|fail|ERR/i.test(t) && t.trim()) lines.push(t.trim().slice(0, 200));
        if (lines.length >= 8) break;
      }
      let diagnosis = "Diagnosis unavailable — GEMINI_API_KEY not set.";
      const key = process.env.GEMINI_API_KEY;
      if (key && lines.length > 0) {
        try {
          const g = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-goog-api-key": key },
              body: JSON.stringify({
                system_instruction: {
                  parts: [
                    {
                      text: "You are a Vercel/Next.js build doctor. Given build error lines, reply in 3 short Hinglish bullet points: (1) probable cause, (2) exact fix, (3) file to change. No fluff, no fake confidence.",
                    },
                  ],
                },
                contents: [{ role: "user", parts: [{ text: lines.join("\n").slice(0, 4000) }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
              }),
            }
          );
          const gj = await g.json();
          const d: string =
            gj?.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text || "")
              .join("")?.trim() || "";
          if (d) diagnosis = d;
        } catch {
          /* keep fallback */
        }
      }
      return {
        ok: false,
        summary: "Latest deploy ERROR — diagnosis ready. Auto-fix NOT applied (coming soon).",
        detail: { state: "ERROR", url: latest.url, errors: lines, diagnosis },
      };
    }
    return {
      ok: true,
      summary: `Deploy state: ${latest.state} — watching.`,
      detail: { state: latest.state },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return { ok: false, summary: `Doctor failed: ${msg}` };
  }
}

/** Backend: Supabase connectivity + key health. SIRF read-only — koi write nahi. */
export async function backendCheck(): Promise<CheckResult> {
  const url = process.env.DEFAULT_SUPABASE_URL;
  const anon = process.env.DEFAULT_SUPABASE_ANON_KEY;
  if (!url) return { ok: true, summary: "Idle — Supabase not connected." };
  try {
    const r = await timedFetch(`${url.replace(/\/$/, "")}/rest/v1/`, 7000, {
      headers: { apikey: anon || "", Authorization: `Bearer ${anon || ""}` },
    });
    if (r.status === 401 || r.status === 403) {
      return {
        ok: false,
        summary: "Supabase reachable but anon key rejected (401/403) — /settings me key check karo.",
        detail: { status: r.status },
      };
    }
    const ok = r.status < 500;
    return {
      ok,
      summary: ok
        ? `Supabase reachable — HTTP ${r.status}. RLS audit: coming soon (service-role support chahiye).`
        : `Supabase DOWN — HTTP ${r.status}.`,
      detail: { status: r.status },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return { ok: false, summary: `Supabase unreachable — ${msg}` };
  }
}

/** Guard sweep: guardrails configured hain ya nahi — values kabhi expose nahi hoti. */
export async function guardSweep(): Promise<CheckResult> {
  const checks = {
    cronSecretSet: !!process.env.CRON_SECRET,
    ownerPasswordSet: !!process.env.OWNER_PASSWORD,
    encryptionKeySet: !!process.env.ENCRYPTION_KEY,
  };
  const missing = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return {
    ok: missing.length === 0,
    summary:
      missing.length === 0
        ? "Guardrails OK — secrets configured, scan endpoint live."
        : `Missing guardrails: ${missing.join(", ")}`,
    detail: checks,
  };
}
