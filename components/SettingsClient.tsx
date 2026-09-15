"use client";

import { useEffect, useState } from "react";

interface Status {
  authed: boolean;
  configured: boolean;
  hasGemini: boolean;
  hasGh: boolean;
  hasVercel: boolean;
  hasSupabase: boolean;
}

const FIELDS = [
  { key: "geminiKey", label: "Gemini API key (Google AI Studio — free)", placeholder: "AIza…", hint: "AI builder ka dimag. aistudio.google.com se free me banta hai." },
  { key: "ghToken", label: "GitHub PAT (repo scope)", placeholder: "github_pat_…", hint: "Generated code ko tumhare repos me push karne ke liye." },
  { key: "vercelToken", label: "Vercel token", placeholder: "…", hint: "Deploy status + env bootstrap ke liye. Blank = saved wala use hoga." },
  { key: "supabaseUrl", label: "Default Supabase URL (optional)", placeholder: "https://xyz.supabase.co", hint: "Generated apps me prefill hoga." },
  { key: "supabaseAnon", label: "Default Supabase anon key (optional)", placeholder: "eyJ…", hint: "Generated apps me prefill hoga." },
];

export default function SettingsClient({ firstRun }: { firstRun: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [ownerPw, setOwnerPw] = useState("");
  const [ownerPw2, setOwnerPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  function set(k: string, v: string) {
    setVals((s) => ({ ...s, [k]: v }));
  }

  async function submit() {
    if (busy) return;
    if (firstRun) {
      if (ownerPw.length < 8) { setResult("❌ Owner password kam se kam 8 characters ka rakho."); return; }
      if (ownerPw !== ownerPw2) { setResult("❌ Password match nahi ho raha."); return; }
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: firstRun ? "setup" : "save",
          ownerPassword: ownerPw || undefined,
          keys: {
            GEMINI_API_KEY: vals.geminiKey || "",
            GH_TOKEN: vals.ghToken || "",
            VERCEL_TOKEN: vals.vercelToken || "",
            DEFAULT_SUPABASE_URL: vals.supabaseUrl || "",
            DEFAULT_SUPABASE_ANON_KEY: vals.supabaseAnon || "",
          },
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setResult(
          "✅ Saved! Vercel env vars set ho gaye" +
            (data.redeploy === "triggered" ? " aur redeploy trigger ho gaya" : "") +
            ". ~1-2 min me refresh karo." +
            (firstRun ? " Ab se /settings owner password se khulega." : "")
        );
        setVals({}); setOwnerPw(""); setOwnerPw2("");
        fetch("/api/settings").then((r2) => r2.json()).then(setStatus).catch(() => {});
      } else {
        setResult(`❌ ${data.error || "Save failed."}`);
      }
    } catch {
      setResult("❌ Network error.");
    } finally {
      setBusy(false);
    }
  }

  function dot(on: boolean) {
    return <span className={`inline-block h-2 w-2 rounded-full ${on ? "bg-emerald-400" : "bg-zinc-700"}`} />;
  }

  return (
    <div className="space-y-5">
      {status && !firstRun && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400">
          <span className="flex items-center gap-2">{dot(status.hasGemini)} Gemini</span>
          <span className="flex items-center gap-2">{dot(status.hasGh)} GitHub</span>
          <span className="flex items-center gap-2">{dot(status.hasVercel)} Vercel</span>
          <span className="flex items-center gap-2">{dot(status.hasSupabase)} Supabase defaults</span>
        </div>
      )}

      {(firstRun || true) && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-bold">{firstRun ? "🔑 Owner password (pehli baar)" : "🔑 Owner password (change karna ho to)"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="password" value={ownerPw} onChange={(e) => setOwnerPw(e.target.value)}
              placeholder={firstRun ? "Naya password (min 8)" : "Naya password (blank = no change)"}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="password" value={ownerPw2} onChange={(e) => setOwnerPw2(e.target.value)}
              placeholder="Confirm password"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-bold">🔌 API keys</h2>
        <p className="mt-1 text-xs text-zinc-500">Blank field = purani value rehne do. Keys kabhi screen/log me nahi dikhengi.</p>
        <div className="mt-4 space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-zinc-300">{f.label}</label>
              <input
                type="password" value={vals[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 font-mono text-sm outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[11px] text-zinc-600">{f.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={submit} disabled={busy}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {busy ? "Saving + redeploying…" : firstRun ? "🚀 Setup MeraAI" : "💾 Save keys"}
      </button>
      {result && (
        <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">{result}</pre>
      )}
    </div>
  );
}
