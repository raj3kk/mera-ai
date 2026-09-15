"use client";

import { useState } from "react";

export default function PasswordGate({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });
      const data = await r.json();
      if (data.ok) {
        window.location.href = next;
      } else {
        setError(data.error || "Wrong password.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
      <p className="text-2xl">🔒</p>
      <h1 className="mt-2 text-lg font-bold">Owner access</h1>
      <p className="mt-1 text-xs text-zinc-500">Enter your MeraAI owner password to continue.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && login()}
        placeholder="Owner password"
        className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <button
        onClick={login}
        disabled={busy || !password}
        className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {busy ? "Checking…" : "Unlock"}
      </button>
    </div>
  );
}
