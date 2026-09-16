"use client";

import { useEffect, useState } from "react";

interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  capability: "live" | "coming-soon";
  capabilityNote: string;
  trigger: string;
  route: string;
  method: "GET" | "POST";
}

interface RunRec {
  at: string;
  ok: boolean;
  summary: string;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AgentsTab() {
  const [data, setData] = useState<{ agents: AgentDef[]; runs: Record<string, RunRec> } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = () => {
    fetch("/api/agents/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setData(d);
      })
      .catch(() => setErr("Network error loading agents."));
  };

  useEffect(load, []);

  const setIn = (k: string, v: string) => setInputs((p) => ({ ...p, [k]: v }));

  async function call(id: string, route: string, method: "GET" | "POST", body?: unknown) {
    setBusy(id);
    try {
      const r = await fetch(route, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const j = await r.json();
      setResult((p) => ({ ...p, [id]: j }));
    } catch {
      setResult((p) => ({ ...p, [id]: { error: "Network error" } }));
    }
    setBusy(null);
    load();
  }

  if (err)
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-amber-300">
        ⚠️ {err}
      </div>
    );
  if (!data) return <p className="text-sm text-zinc-500">Loading agents…</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-relaxed text-zinc-400">
        <span className="mr-3 inline-block rounded-full bg-emerald-900 px-2.5 py-0.5 font-semibold text-emerald-300">Live</span>
        asal me kaam karta hai
        <span className="ml-4 mr-3 inline-block rounded-full bg-amber-900 px-2.5 py-0.5 font-semibold text-amber-300">Coming soon</span>
        planned hai, abhi nahi — koi fake "AI ne kar diya" claim nahi.
      </div>

      {data.agents.map((a) => {
        const run = data.runs[a.id];
        const res = result[a.id] as { ok?: boolean; summary?: string; error?: string; answer?: string; score?: number; checks?: { name: string; pass: boolean; hint: string }[]; suggestions?: string[]; verdict?: string; findings?: { file: string; line: number; kind: string }[] } | undefined;
        return (
          <div key={a.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {a.emoji} {a.name}{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      a.capability === "live"
                        ? "bg-emerald-900 text-emerald-300"
                        : "bg-amber-900 text-amber-300"
                    }`}
                  >
                    {a.capability === "live" ? "Live" : "Coming soon"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">{a.tagline}</p>
              </div>
              <span className="text-[11px] text-zinc-500">{a.trigger}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{a.capabilityNote}</p>

            {run && (
              <p className={`mt-2 text-xs ${run.ok ? "text-emerald-400" : "text-amber-300"}`}>
                {run.ok ? "✅" : "⚠️"} Last run {timeAgo(run.at)} — {run.summary}
              </p>
            )}

            <div className="mt-3 space-y-2">
              {a.method === "GET" && (
                <button
                  onClick={() => call(a.id, a.route, "GET")}
                  disabled={busy === a.id}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-50"
                >
                  {busy === a.id ? "Running…" : "▶ Run now"}
                </button>
              )}
              {a.id === "builder" && (
                <div className="space-y-2">
                  <input
                    value={inputs.builderPrompt || ""}
                    onChange={(e) => setIn("builderPrompt", e.target.value)}
                    placeholder="Kaisa app banana hai? (e.g. meri dukaan ke liye billing page)"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      value={inputs.builderRepo || ""}
                      onChange={(e) => setIn("builderRepo", e.target.value)}
                      placeholder="Target repo (username/app-name)"
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs"
                    />
                    <button
                      onClick={() => call(a.id, a.route, "POST", { prompt: inputs.builderPrompt, repo: inputs.builderRepo })}
                      disabled={busy === a.id || !(inputs.builderPrompt || "").trim() || !(inputs.builderRepo || "").trim()}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {busy === a.id ? "Building…" : "🏗️ Build"}
                    </button>
                  </div>
                </div>
              )}
              {a.id === "support" && (
                <div className="flex gap-2">
                  <input
                    value={inputs.supportQ || ""}
                    onChange={(e) => setIn("supportQ", e.target.value)}
                    placeholder="Sawal puchho (e.g. GitHub kaise connect karun?)"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs"
                  />
                  <button
                    onClick={() => call(a.id, a.route, "POST", { question: inputs.supportQ })}
                    disabled={busy === a.id || !(inputs.supportQ || "").trim()}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {busy === a.id ? "…" : "Ask"}
                  </button>
                </div>
              )}
              {a.id === "seo" && (
                <div className="flex gap-2">
                  <input
                    value={inputs.seoUrl || ""}
                    onChange={(e) => setIn("seoUrl", e.target.value)}
                    placeholder="https://your-app.vercel.app"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs"
                  />
                  <button
                    onClick={() => call(a.id, a.route, "POST", { url: inputs.seoUrl })}
                    disabled={busy === a.id || !(inputs.seoUrl || "").trim()}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {busy === a.id ? "…" : "Audit"}
                  </button>
                </div>
              )}
              {a.id === "guard" && (
                <div className="flex gap-2">
                  <input
                    value={inputs.guardText || ""}
                    onChange={(e) => setIn("guardText", e.target.value)}
                    placeholder="Prompt screen karo (injection test)"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs"
                  />
                  <button
                    onClick={() => call(a.id, a.route, "POST", { action: "screen", text: inputs.guardText })}
                    disabled={busy === a.id || !(inputs.guardText || "").trim()}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {busy === a.id ? "…" : "Screen"}
                  </button>
                </div>
              )}
            </div>

            {res && (
              <div className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs">
                {res.error && <p className="text-red-400">❌ {res.error}</p>}
                {res.summary && <p className="text-zinc-300">{res.ok ? "✅" : "⚠️"} {res.summary}</p>}
                {res.answer && <p className="text-zinc-300">💬 {res.answer}</p>}
                {typeof res.score === "number" && (
                  <div>
                    <p className="font-semibold text-zinc-200">SEO score: {res.score}/100</p>
                    {res.checks?.map((c) => (
                      <p key={c.name} className={c.pass ? "text-emerald-400" : "text-amber-300"}>
                        {c.pass ? "✓" : "✗"} {c.name} — <span className="text-zinc-500">{c.hint}</span>
                      </p>
                    ))}
                  </div>
                )}
                {res.verdict && (
                  <p className={res.verdict === "BLOCK" ? "text-red-400" : "text-emerald-400"}>
                    🛡️ Verdict: {res.verdict}
                    {res.findings && res.findings.length > 0 && ` (${res.findings.length} findings)`}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
