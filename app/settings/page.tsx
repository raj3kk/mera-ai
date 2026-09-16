import { allowSettingsAccess, ownerConfigured } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import SettingsClient from "@/components/SettingsClient";
import ConnectionCards from "@/components/ConnectionCards";

const ERROR_COPY: Record<string, string> = {
  "state-mismatch": "Security check fail ho gaya — dobara Connect dabao.",
  "no-code": "GitHub/Vercel se code nahi mila — dobara try karo.",
  "oauth-not-configured":
    "OAuth app credentials set nahi hain — neeche guide follow karke Client ID/Secret save karo.",
  "token-exchange-failed":
    "Token exchange fail ho gaya — OAuth app ki Client Secret check karo, phir dobara try karo.",
  "token-invalid": "Mila hua token kaam nahi kar raha — dobara Connect dabao.",
  "vercel-token-missing":
    "Pehle Vercel connect karo (neeche manual form me token paste karke Save) — tabhi GitHub token save ho payega.",
  "save-failed": "Token save nahi ho paya — Vercel token check karo aur dobara try karo.",
};

export default function SettingsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string; guide?: string };
}) {
  if (!allowSettingsAccess()) return <PasswordGate next="/settings" />;
  const firstRun = !ownerConfigured();

  const connected =
    searchParams.connected === "github" || searchParams.connected === "vercel"
      ? searchParams.connected
      : null;
  const errorCopy = searchParams.error
    ? ERROR_COPY[searchParams.error] ?? "Kuch gadbad ho gayi — dobara try karo."
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {firstRun
            ? "Pehli baar setup: owner password banao, phir neeche keys connect karo."
            : "Services connect karo — jahan 1-click button hai wahan OAuth, baaki me guided steps."}
        </p>
      </div>

      {connected && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-300">
          ✅ {connected === "github" ? "GitHub" : "Vercel"} connect ho gaya! Token encrypted save ho
          gaya hai. ~1-2 min me Connected badge green ho jayega (redeploy chal raha hai).
        </div>
      )}
      {errorCopy && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          ❌ {errorCopy}
        </div>
      )}

      {!firstRun && <ConnectionCards />}
      <SettingsClient firstRun={firstRun} />
    </div>
  );
}
