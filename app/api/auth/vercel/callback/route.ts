import { NextRequest, NextResponse } from "next/server";
import {
  clearStateCookie,
  ownerGate,
  readStateCookie,
  saveEnvVar,
  statesMatch,
  triggerRedeploy,
} from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const gate = ownerGate();
  if (gate) return gate;

  const origin = req.nextUrl.origin;
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/settings?error=${code}`, origin));
    clearStateCookie(res);
    return res;
  };

  // CSRF check: ?state must match the httpOnly cookie set by /start.
  const state = req.nextUrl.searchParams.get("state");
  if (!statesMatch(state, readStateCookie())) return fail("state-mismatch");

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return fail("no-code");

  const clientId = process.env.VERCEL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.VERCEL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("oauth-not-configured");

  const redirectUri = `${origin}/api/auth/vercel/callback`;

  // Exchange the code for an access token (server-side only, never exposed to the client).
  let token: string | null = null;
  try {
    const r = await fetch("https://api.vercel.com/v2/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });
    const j = await r.json();
    token = typeof j?.access_token === "string" ? j.access_token : null;
  } catch {
    token = null;
  }
  if (!token) return fail("token-exchange-failed");

  // Validate the token before storing it.
  try {
    const me = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!me.ok) return fail("token-invalid");
  } catch {
    return fail("token-invalid");
  }

  // Self-bootstrap: use the fresh token itself to store it as VERCEL_TOKEN
  // (the env name the app actually reads). No prior token needed.
  const saved = await saveEnvVar(token, "VERCEL_TOKEN", token);
  // token leaves scope here — never logged, never sent to the client.
  if (!saved) return fail("save-failed");

  await triggerRedeploy(token);
  const res = NextResponse.redirect(new URL("/settings?connected=vercel", origin));
  clearStateCookie(res);
  return res;
}
