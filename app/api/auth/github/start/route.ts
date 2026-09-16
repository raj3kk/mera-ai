import { NextRequest, NextResponse } from "next/server";
import { newState, ownerGate, setStateCookie } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const gate = ownerGate();
  if (gate) return gate;

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    // OAuth app not configured yet — settings page shows the 2-step Hinglish guide.
    return NextResponse.redirect(new URL("/settings?guide=github", req.nextUrl.origin));
  }

  const state = newState();
  const redirectUri = `${req.nextUrl.origin}/api/auth/github/callback`;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  setStateCookie(res, state);
  return res;
}
