import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { isOwner } from "./auth";

export const OAUTH_STATE_COOKIE = "mera_oauth_state";
const STATE_TTL_SECONDS = 600; // 10 minutes
const VERCEL_API = "https://api.vercel.com";
const PROJECT_NAME = "mera-ai";

/** Owner gate for OAuth start/callback routes. Returns a 401 JSON response when blocked, else null. */
export function ownerGate(): NextResponse | null {
  if (!isOwner()) {
    return NextResponse.json({ error: "Owner login required." }, { status: 401 });
  }
  return null;
}

export function newState(): string {
  return randomBytes(24).toString("hex");
}

function cookieFlags(maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setStateCookie(res: NextResponse, state: string): void {
  res.headers.append(
    "Set-Cookie",
    `${OAUTH_STATE_COOKIE}=${state}; ${cookieFlags(STATE_TTL_SECONDS)}`
  );
}

export function clearStateCookie(res: NextResponse): void {
  res.headers.append("Set-Cookie", `${OAUTH_STATE_COOKIE}=; ${cookieFlags(0)}`);
}

export function readStateCookie(): string | null {
  return cookies().get(OAUTH_STATE_COOKIE)?.value ?? null;
}

/** Timing-safe CSRF state comparison. */
export function statesMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function vfetch(token: string, path: string, method = "GET", body?: unknown) {
  const r = await fetch(VERCEL_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  return { status: r.status, json };
}

/**
 * Save (create or update) one env var on the Vercel project.
 * The token is only used for this API call and never logged or stored.
 */
export async function saveEnvVar(
  vercelToken: string,
  key: string,
  value: string
): Promise<boolean> {
  const proj = await vfetch(vercelToken, `/v9/projects/${PROJECT_NAME}`);
  const projectId: string | undefined = proj.json?.id;
  if (!projectId) return false;

  const existing = await vfetch(vercelToken, `/v9/projects/${projectId}/env`);
  const found = (existing.json?.envs ?? []).find((e: any) => e?.key === key);

  if (found?.id) {
    const r = await vfetch(vercelToken, `/v9/projects/${projectId}/env/${found.id}`, "PATCH", {
      value,
    });
    return r.status === 200;
  }
  const r = await vfetch(vercelToken, `/v9/projects/${projectId}/env`, "POST", {
    key,
    value,
    type: "encrypted",
    target: ["production", "preview", "development"],
  });
  return r.status === 200 || r.status === 201;
}

/** Best-effort production redeploy so new env vars take effect. Never throws. */
export async function triggerRedeploy(vercelToken: string): Promise<void> {
  try {
    const proj = await vfetch(vercelToken, `/v9/projects/${PROJECT_NAME}`);
    const projectId: string | undefined = proj.json?.id;
    const repoId = proj.json?.link?.repoId;
    if (!projectId || !repoId) return;
    await vfetch(vercelToken, "/v13/deployments", "POST", {
      name: PROJECT_NAME,
      project: projectId,
      target: "production",
      gitSource: { type: "github", repoId: String(repoId), ref: "main" },
    });
  } catch {
    /* best effort only */
  }
}
