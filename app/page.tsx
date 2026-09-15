import { Suspense } from "react";
import BuilderChat from "@/components/BuilderChat";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Describe it. <span className="text-emerald-400">MeraAI builds it.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
          Type what you want — a shop, a portfolio, a dashboard. MeraAI writes
          production-ready Next.js + Supabase code, pushes it to your GitHub,
          and Vercel deploys it. Your stack, your accounts, your code.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-zinc-500">
          {["Next.js 14", "TypeScript", "Tailwind", "Supabase backend", "GitHub push", "Vercel deploy"].map((t) => (
            <span key={t} className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
              {t}
            </span>
          ))}
        </div>
      </section>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading builder…</p>}>
        <BuilderChat />
      </Suspense>
    </div>
  );
}
