"use client";

import { useState } from "react";
import DashboardClient from "./DashboardClient";
import AgentsTab from "./AgentsTab";

export default function DashboardTabs() {
  const [tab, setTab] = useState<"projects" | "agents">("projects");

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("projects")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === "projects"
              ? "bg-emerald-700 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          🚀 Projects
        </button>
        <button
          onClick={() => setTab("agents")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === "agents"
              ? "bg-emerald-700 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          🤖 Agents
        </button>
      </div>
      {tab === "projects" ? <DashboardClient /> : <AgentsTab />}
    </div>
  );
}
