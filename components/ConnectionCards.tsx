import { headers } from "next/headers";
import { isOwner } from "@/lib/auth";

function Badge({ on }: { on: boolean }) {
  return on ? (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
      ● Connected
    </span>
  ) : (
    <span className="rounded-full bg-zinc-700/40 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
      ○ Not connected
    </span>
  );
}

function Card({
  emoji,
  title,
  connected,
  children,
}: {
  emoji: string;
  title: string;
  connected: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">
          {emoji} {title}
        </h2>
        <Badge on={connected} />
      </div>
      <div className="mt-3 space-y-3 text-xs leading-relaxed text-zinc-400">{children}</div>
    </div>
  );
}

function ConnectButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
    >
      {children}
    </a>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="block select-all break-all rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-emerald-300">
      {children}
    </code>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-200">
        {n}
      </span>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/**
 * Server-rendered connection cards: OAuth buttons when the OAuth app
 * credentials are configured, otherwise a short Hinglish setup guide.
 * Guides are server-rendered so they work with zero JS and are curl-visible.
 */
export default function ConnectionCards() {
  const authed = isOwner();
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "tumhara-app.vercel.app";
  const base = `https://${host}`;
  const ghCallback = `${base}/api/auth/github/callback`;
  const vercelCallback = `${base}/api/auth/vercel/callback`;

  const ghOauthReady = !!process.env.GITHUB_OAUTH_CLIENT_ID;
  const vercelOauthReady = !!process.env.VERCEL_OAUTH_CLIENT_ID;

  return (
    <div className="space-y-4">
      {/* ---------- GitHub ---------- */}
      <Card emoji="🐙" title="GitHub" connected={!!process.env.GH_TOKEN}>
        {authed && ghOauthReady ? (
          <>
            <ConnectButton href="/api/auth/github/start">🔗 GitHub se Connect karo</ConnectButton>
            <p>1 click — token copy-paste ka jhanjhat nahi. Generated code seedha tumhare repos me push hoga.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-zinc-300">
              1-click connect ke liye ek baar GitHub OAuth App banao (2 minute, sirf pehli baar):
            </p>
            <Step n={1}>
              <p>
                <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                  github.com/settings/developers
                </a>{" "}
                kholo → <b>“New OAuth App”</b> dabao.
              </p>
            </Step>
            <Step n={2}>
              <p>
                <b>Authorization callback URL</b> me ye exact line paste karo, phir <b>Register application</b>:
              </p>
              <Code>{ghCallback}</Code>
              <p>
                Phir <b>Client ID</b> copy karo, <b>“Generate a new client secret”</b> se secret banao — dono
                neeche wale form ke “OAuth app credentials” me paste karke Save dabao. Uske baad yahin
                1-click Connect button aa jayega.
              </p>
            </Step>
            {!authed && <p>Owner login ke baad yahan Connect button dikhega.</p>}
          </>
        )}
      </Card>

      {/* ---------- Vercel ---------- */}
      <Card emoji="▲" title="Vercel" connected={!!process.env.VERCEL_TOKEN}>
        {authed && vercelOauthReady ? (
          <>
            <ConnectButton href="/api/auth/vercel/start">🔗 Vercel se Connect karo</ConnectButton>
            <p>1 click — deploy status aur env bootstrap ke liye. Token encrypted save hoga.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-zinc-300">
              1-click connect ke liye ek baar Vercel Integration banao (2 minute, sirf pehli baar):
            </p>
            <Step n={1}>
              <p>
                <a href="https://vercel.com/integrations" target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                  vercel.com/integrations
                </a>{" "}
                kholo → <b>“New Integration”</b> dabao.
              </p>
            </Step>
            <Step n={2}>
              <p>
                <b>Redirect URL</b> me ye exact line paste karo, phir <b>Create</b>:
              </p>
              <Code>{vercelCallback}</Code>
              <p>
                Phir <b>Client ID</b> aur <b>Client Secret</b> copy karke neeche wale form ke “OAuth app
                credentials” me paste karke Save dabao. Uske baad yahin 1-click Connect button aa jayega.
              </p>
            </Step>
            {!authed && <p>Owner login ke baad yahan Connect button dikhega.</p>}
          </>
        )}
      </Card>

      {/* ---------- Supabase ---------- */}
      <Card emoji="🗄️" title="Supabase" connected={!!process.env.DEFAULT_SUPABASE_URL}>
        <p className="font-semibold text-zinc-300">
          Supabase me OAuth nahi hota — 3 chhote steps me manually connect karo:
        </p>
        <Step n={1}>
          <p>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">
              supabase.com/dashboard
            </a>{" "}
            kholo → apna project select karo.
          </p>
        </Step>
        <Step n={2}>
          <p>
            Left sidebar me <b>Project Settings</b> → <b>API</b> kholo.
          </p>
        </Step>
        <Step n={3}>
          <p>
            <b>Project URL</b> aur <b>anon public key</b> copy karke neeche wale form me paste karo →{" "}
            <b>Save</b> dabao. Generated apps me yehi prefill hoga.
          </p>
        </Step>
      </Card>

      {/* ---------- Gemini ---------- */}
      <Card emoji="✨" title="Gemini (AI ka dimag)" connected={!!process.env.GEMINI_API_KEY}>
        <p className="font-semibold text-zinc-300">Free API key 2 minute me:</p>
        <Step n={1}>
          <p>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 underline">
              aistudio.google.com/apikey
            </a>{" "}
            kholo (Google login free hai).
          </p>
        </Step>
        <Step n={2}>
          <p>
            <b>“Create API key”</b> dabao.
          </p>
        </Step>
        <Step n={3}>
          <p>
            Key copy karke neeche wale form me paste karo → <b>Save</b> dabao. Iske bina AI chat kaam
            nahi karega.
          </p>
        </Step>
      </Card>
    </div>
  );
}
