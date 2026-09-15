"use client";

import { useEffect, useState } from "react";

interface Project {
  name: string;
  full_name: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  deploy: null | { state: string; url: string; createdAt: number };
}

function badge(state: string) {
  const map: Record<string, string> = {
    READY: "bg-emerald-900 text-emerald-300",
    BUILDING: "bg-amber-900 text-amber-300",
    ERROR: "bg-red-900 text-red-300",
    QUEUED: "bg-zinc-800 text-zinc-300",
    CANCELED: "bg-zinc-800 text-zinc-500",
  };
  return map[state] || "bg-zinc-800 text-zinc-300";
}

export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setProjects(d.projects);
      })
      .catch(() => setError("Network error loading projects."));
  }, []);

  if (error)
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-amber-300">
        ⚠️ {error}
        <p className="mt-2 text-xs text-zinc-500">
          GitHub + Vercel tokens <a className="underline text-emerald-400" href="/settings">/settings</a> me add karo.
        </p>
      </div>
    );

  if (!projects)
    return <p className="text-sm text-zinc-500">Loading projects…</p>;

  if (projects.length === 0)
    return <p className="text-sm text-zinc-500">Koi repo nahi mila. Builder se pehla app push karo 🚀</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((p) => (
        <div key={p.full_name} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-start justify-between gap-2">
            <a href={p.html_url} target="_blank" rel="noreferrer" className="font-mono text-sm font-semibold text-emerald-400 hover:underline">
              {p.name}
            </a>
            {p.deploy ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge(p.deploy.state)}`}>
                {p.deploy.state}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-500">no deploy</span>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {p.language || "—"} · updated {new Date(p.updated_at).toLocaleDateString()}
          </p>
          {p.deploy && (
            <a
              href={`https://${p.deploy.url}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-zinc-400 underline hover:text-white"
            >
              {p.deploy.url} ↗
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
