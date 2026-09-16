import { NextRequest, NextResponse } from "next/server";
import { newState, ownerGate, setStateCookie } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const gate = ownerGate();
  if (gate) return gate;

  const clientId = process.env.VERCEL_OAUTH_CLIENT_ID;
  if (!clientId) {
    // Integration not configured yet — settings page shows the Hinglish guide.
    return NextResponse.redirect(new URL("/settings?guide=vercel", req.nextUrl.origin));
  }

  const state = newState();
  const redirectUri = `${req.nextUrl.origin}/api/auth/vercel/callback`;
  const url = new URL("https://vercel.com/integration/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  setStateCookie(res, state);
  return res;
}
