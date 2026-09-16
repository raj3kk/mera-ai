export type Capability = "live" | "coming-soon";

export interface AgentDef {
  id: "builder" | "doctor" | "backend" | "support" | "monitor" | "seo" | "guard";
  name: string;
  emoji: string;
  tagline: string;
  /** "live" = asal me kaam karta hai · "coming-soon" = planned, abhi stub */
  capability: Capability;
  /** Honest detail — kya live hai, kya nahi. */
  capabilityNote: string;
  trigger: string;
  route: string;
  method: "GET" | "POST";
}

export const AGENTS: AgentDef[] = [
  {
    id: "builder",
    name: "Builder",
    emoji: "🏗️",
    tagline: "Prompt se plan → code → GitHub push, ek pipeline me.",
    capability: "live",
    capabilityNote:
      "Live: single build job synchronous chalti hai (prompt → code → push). Lambi builds Hobby ke function timeout me atak sakti hain — durable job queue Coming soon.",
    trigger: "On-demand",
    route: "/api/agents/builder",
    method: "POST",
  },
  {
    id: "doctor",
    name: "Doctor",
    emoji: "🩺",
    tagline: "Failed deploys pakadta hai, error logs padh ke diagnosis deta hai.",
    capability: "live",
    capabilityNote:
      "Live: daily deploy health check + error diagnosis (retry cap 2/deploy — credit-burn protection). Fix sirf suggest hota hai; auto-fix push Coming soon.",
    trigger: "Daily cron + on-demand",
    route: "/api/agents/doctor",
    method: "GET",
  },
  {
    id: "backend",
    name: "Backend",
    emoji: "🗄️",
    tagline: "Tumhare Supabase ka health check — sirf read-only, kuch todta nahi.",
    capability: "live",
    capabilityNote:
      "Live: connectivity + anon-key validity (read-only). RLS policy audit Coming soon — uske liye service-role support chahiye.",
    trigger: "Daily cron + on-demand",
    route: "/api/agents/backend",
    method: "GET",
  },
  {
    id: "support",
    name: "Support",
    emoji: "💬",
    tagline: "MeraAI ke sawalon ke jawab — docs se grounded, guess nahi.",
    capability: "live",
    capabilityNote:
      "Live: FAQ-grounded jawab (Hinglish). Jo docs me nahi, uska jawab seedha 'pata nahi'.",
    trigger: "On-demand",
    route: "/api/agents/support",
    method: "POST",
  },
  {
    id: "monitor",
    name: "Monitor",
    emoji: "📡",
    tagline: "Platform uptime nazar me — 5xx ya slow response pe alert.",
    capability: "live",
    capabilityNote:
      "Live: daily uptime check + dashboard alert. Email/WhatsApp alerts Coming soon.",
    trigger: "Daily cron + on-demand",
    route: "/api/agents/monitor",
    method: "GET",
  },
  {
    id: "seo",
    name: "SEO",
    emoji: "🔍",
    tagline: "Generated apps ka SEO audit — missing tags pakdo.",
    capability: "live",
    capabilityNote:
      "Live: on-demand audit (title/meta/OG/canonical) + fix suggestions. One-click auto-fix Coming soon.",
    trigger: "On-demand",
    route: "/api/agents/seo",
    method: "POST",
  },
  {
    id: "guard",
    name: "Guard",
    emoji: "🛡️",
    tagline: "Abuse control — secret-scan, prompt screening, guardrail sweep.",
    capability: "live",
    capabilityNote:
      "Live: pre-push secret scan + prompt-injection screening (Builder har push se pehle chalata hai). Persistent cross-instance rate limiting Coming soon (KV/DB chahiye).",
    trigger: "Daily sweep + on-demand",
    route: "/api/agents/guard",
    method: "POST",
  },
];
