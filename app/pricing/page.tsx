import Link from "next/link";
import { isOwner } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";

const FREE_FEATURES = [
  "Unlimited chat builds (apni free Gemini key pe)",
  "Plan mode — approve se pehle code nahi",
  "Push to your GitHub — zero lock-in",
  "Full project ZIP download",
  "6 starter templates",
  "Dashboard: repos + deploy status",
];

const PLUS_FEATURES = [
  "Sab kuch Free wala, plus:",
  "Priority build queue",
  "Bigger apps — zyada files per build",
  "One-click Vercel deploy (coming)",
  "Team workspaces (coming)",
];

export default function PricingPage() {
  if (!isOwner()) return <PasswordGate next="/pricing" />;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">💰 Simple pricing. No credit-burn.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
          Metered "effort" pricing nahi. Opaque credit system nahi. Jo dikhta hai wahi lagta hai —
          aur Free hamesha free rahega.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-bold">Free</h2>
          <p className="mt-1 text-3xl font-bold">₹0 <span className="text-sm font-normal text-zinc-500">forever</span></p>
          <ul className="mt-5 space-y-2.5 text-sm text-zinc-300">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2"><span className="text-emerald-400">✓</span>{f}</li>
            ))}
          </ul>
          <Link href="/" className="mt-6 block rounded-xl bg-zinc-800 py-2.5 text-center text-sm font-semibold hover:bg-zinc-700">
            Start building →
          </Link>
        </div>

        <div className="rounded-2xl border border-emerald-700 bg-gradient-to-b from-emerald-950/40 to-zinc-900/40 p-6">
          <h2 className="text-lg font-bold">MeraAI Plus <span className="ml-1 rounded-full bg-emerald-900 px-2 py-0.5 text-[11px] text-emerald-300">coming soon</span></h2>
          <p className="mt-1 text-3xl font-bold">₹__ <span className="text-sm font-normal text-zinc-500">/month · flat, ek hi tier</span></p>
          <ul className="mt-5 space-y-2.5 text-sm text-zinc-300">
            {PLUS_FEATURES.map((f) => (
              <li key={f} className="flex gap-2"><span className="text-emerald-400">✓</span>{f}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            📱 UPI payments coming soon. Launch pe sirf <b className="text-zinc-200">ek flat tier</b> hoga —
            koi per-message metering, koi "effort" pricing, koi surprise bill nahi.
          </p>
          <button disabled className="mt-4 w-full cursor-not-allowed rounded-xl bg-emerald-900/40 py-2.5 text-sm font-semibold text-emerald-300/60">
            Notify me at launch
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-600">
        Personal mode me AI cost tumhari apni free Gemini key se chalti hai — isliye MeraAI tumse per-token charge nahi karta. Kabhi nahi karega.
      </p>
    </div>
  );
}
