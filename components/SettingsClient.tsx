"use client";

import { useState } from "react";

interface Field {
  key: string;
  label: string;
  placeholder: string;
  hint: string;
}

const SECTIONS: { title: string; note?: string; fields: Field[] }[] = [
  {
    title: "✨ Gemini API key",
    note: "AI builder ka dimag — iske bina chat kaam nahi karega.",
    fields: [
      { key: "geminiKey", label: "Gemini API key", placeholder: "AIza…", hint: "aistudio.google.com/apikey → Create API key (free)." },
    ],
  },
  {
    title: "🐙 GitHub — manual fallback",
    note: "1-click Connect upar hai. Ye field sirf tab bharo jab OAuth nahi chahiye.",
    fields: [
      { key: "ghToken", label: "GitHub PAT (repo scope)", placeholder: "github_pat_…", hint: "github.com → Settings → Developer settings → Personal access tokens." },
    ],
  },
  {
    title: "▲ Vercel — manual fallback",
    note: "1-click Connect upar hai. Pehli baar setup me token yahin se jata hai.",
    fields: [
      { key: "vercelToken", label: "Vercel token", placeholder: "…", hint: "vercel.com → Account Settings → Tokens → Create. Blank = saved wala use hoga." },
    ],
  },
  {
    title: "🗄️ Supabase (optional)",
    note: "Generated apps me prefill hoga.",
    fields: [
      { key: "supabaseUrl", label: "Supabase Project URL", placeholder: "https://xyz.supabase.co", hint: "Dashboard → Project Settings → API → Project URL." },
      { key: "supabaseAnon", label: "Supabase anon key", placeholder: "eyJ…", hint: "Usi API page pe “anon public” key." },
    ],
  },
  {
    title: "🔑 OAuth app credentials (ek baar ka setup)",
    note: "Upar wale 1-click Connect buttons inhi se chalte hain. Guide cards me hai — yahan paste karke Save dabao.",
    fields: [
      { key: "ghOAuthId", label: "GitHub OAuth Client ID", placeholder: "Ov23…", hint: "GitHub OAuth App page se." },
      { key: "ghOAuthSecret", label: "GitHub OAuth Client Secret", placeholder: "…", hint: "“Generate a new client secret” se banta hai. Sirf ek baar dikhta hai!" },
      { key: "vercelOAuthId", label: "Vercel Integration Client ID", placeholder: "…", hint: "vercel.com/integrations → tumhara integration." },
      { key: "vercelOAuthSecret", label: "Vercel Integration Client Secret", placeholder: "…", hint: "Usi integration page se." },
    ],
  },
];

export default function SettingsClient({ firstRun }: { firstRun: boolean }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [ownerPw, setOwnerPw] = useState("");
  const [ownerPw2, setOwnerPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
            GITHUB_OAUTH_CLIENT_ID: vals.ghOAuthId || "",
            GITHUB_OAUTH_CLIENT_SECRET: vals.ghOAuthSecret || "",
            VERCEL_OAUTH_CLIENT_ID: vals.vercelOAuthId || "",
            VERCEL_OAUTH_CLIENT_SECRET: vals.vercelOAuthSecret || "",
          },
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setResult(
          "✅ Saved! Vercel env vars set ho gaye" +
            (data.redeploy === "triggered" ? " aur redeploy trigger ho gaya" : "") +
            ". ~1-2 min me page refresh karo — Connected badges green ho jayenge." +
            (firstRun ? " Ab se /settings owner password se khulega." : "")
        );
        setVals({}); setOwnerPw(""); setOwnerPw2("");
      } else {
        setResult(`❌ ${data.error || "Save failed."}`);
      }
    } catch {
      setResult("❌ Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
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

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-bold">🔌 Keys — manual paste</h2>
        <p className="mt-1 text-xs text-zinc-500">Blank field = purani value rehne do. Keys kabhi screen/log me nahi dikhengi.</p>
        <div className="mt-4 space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="text-xs font-bold text-zinc-200">{s.title}</h3>
              {s.note && <p className="mt-0.5 text-[11px] text-zinc-500">{s.note}</p>}
              <div className="mt-2 space-y-3">
                {s.fields.map((f) => (
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
