import { isOwner } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import DashboardTabs from "@/components/DashboardTabs";

export default function DashboardPage() {
  if (!isOwner()) return <PasswordGate next="/dashboard" />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📊 Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tumhare GitHub repos, Vercel deployments — aur tumhare 7 AI agents.
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-900 bg-emerald-950/20 p-4 text-sm">
        <p className="font-semibold text-emerald-300">🔓 Zero lock-in — disconnect/export anytime</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Tumhara code tumhare GitHub pe hai, tumhare naam se. API keys kabhi bhi{" "}
          <a href="/settings" className="text-emerald-400 underline">/settings</a> se hata sakte ho,
          aur koi bhi project builder se ZIP me download kar sakte ho. MeraAI chhodna ho to kuch
          khona nahi padega — migration tax zero.
        </p>
      </div>
      <DashboardTabs />
    </div>
  );
}
