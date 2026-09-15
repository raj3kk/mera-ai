import { allowSettingsAccess, ownerConfigured } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import SettingsClient from "@/components/SettingsClient";

export default function SettingsPage() {
  if (!allowSettingsAccess()) return <PasswordGate next="/settings" />;
  const firstRun = !ownerConfigured();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {firstRun
            ? "Pehli baar setup: owner password banao aur apne free API keys connect karo."
            : "Keys update karo — save karte hi Vercel pe env vars set ho jayenge aur redeploy hoga."}
        </p>
      </div>
      <SettingsClient firstRun={firstRun} />
    </div>
  );
}
