import { isOwner } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  if (!isOwner()) return <PasswordGate next="/dashboard" />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📊 Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tumhare GitHub repos aur unka latest Vercel deployment status.
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
