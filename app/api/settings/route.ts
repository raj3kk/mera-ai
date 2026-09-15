import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isOwner, ownerConfigured, ownerCookieHeader } from "@/lib/auth";

const VERCEL_API = "https://api.vercel.com";
const PROJECT_NAME = "mera-ai";

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

export async function GET() {
  return NextResponse.json({
    authed: isOwner(),
    configured: ownerConfigured(),
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasGh: !!process.env.GH_TOKEN,
    hasVercel: !!process.env.VERCEL_TOKEN,
    hasSupabase: !!process.env.DEFAULT_SUPABASE_URL,
  });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const action = body?.action;

  // ---- login ----
  if (action === "login") {
    if (!ownerConfigured()) {
      return NextResponse.json(
        { error: "Setup not complete yet — finish first-run setup below." },
        { status: 400 }
      );
    }
    if (body?.password === process.env.OWNER_PASSWORD) {
      const res = NextResponse.json({ ok: true });
      res.headers.set("Set-Cookie", ownerCookieHeader());
      return res;
    }
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  // ---- setup / save (writes env vars to the Vercel project + redeploys) ----
  if (action === "setup" || action === "save") {
    if (action === "setup" && ownerConfigured()) {
      return NextResponse.json({ error: "Already set up. Use Save to update." }, { status: 403 });
    }
    if (action === "save" && !isOwner()) {
      return NextResponse.json({ error: "Owner login required." }, { status: 401 });
    }

    const ownerPassword: string = String(body?.ownerPassword || "");
    if (action === "setup" && ownerPassword.length < 8) {
      return NextResponse.json({ error: "Owner password must be at least 8 characters." }, { status: 400 });
    }

    const keys = body?.keys ?? {};
    const vercelToken: string =
      String(keys.VERCEL_TOKEN || "") || process.env.VERCEL_TOKEN || "";
    if (!vercelToken) {
      return NextResponse.json(
        { error: "Vercel token chahiye — field me daalo (ek baar ke liye)." },
        { status: 400 }
      );
    }

    // Resolve project
    const proj = await vfetch(vercelToken, `/v9/projects/${PROJECT_NAME}`);
    if (proj.status !== 200 || !proj.json?.id) {
      return NextResponse.json(
        { error: `Vercel project '${PROJECT_NAME}' nahi mila (HTTP ${proj.status}). Pehle Vercel me import karo.` },
        { status: 200 }
      );
    }
    const projectId: string = proj.json.id;
    const repoId = proj.json?.link?.repoId;

    // Existing env vars
    const existing = await vfetch(vercelToken, `/v9/projects/${projectId}/env`);
    const envIdByKey = new Map<string, string>();
    for (const e of existing.json?.envs ?? []) {
      if (e?.key && e?.id) envIdByKey.set(e.key, e.id);
    }

    const desired: Record<string, string> = {
      ...(ownerPassword ? { OWNER_PASSWORD: ownerPassword } : {}),
      ...(keys.GEMINI_API_KEY ? { GEMINI_API_KEY: String(keys.GEMINI_API_KEY) } : {}),
      ...(keys.GH_TOKEN ? { GH_TOKEN: String(keys.GH_TOKEN) } : {}),
      ...(keys.VERCEL_TOKEN ? { VERCEL_TOKEN: String(keys.VERCEL_TOKEN) } : {}),
      ...(keys.DEFAULT_SUPABASE_URL ? { DEFAULT_SUPABASE_URL: String(keys.DEFAULT_SUPABASE_URL) } : {}),
      ...(keys.DEFAULT_SUPABASE_ANON_KEY ? { DEFAULT_SUPABASE_ANON_KEY: String(keys.DEFAULT_SUPABASE_ANON_KEY) } : {}),
    };
    if (!envIdByKey.has("ENCRYPTION_KEY")) {
      desired.ENCRYPTION_KEY = randomBytes(32).toString("hex");
    }

    const targets = ["production", "preview", "development"];
    for (const [k, v] of Object.entries(desired)) {
      const eid = envIdByKey.get(k);
      if (eid) {
        await vfetch(vercelToken, `/v9/projects/${projectId}/env/${eid}`, "PATCH", { value: v });
      } else {
        await vfetch(vercelToken, `/v9/projects/${projectId}/env`, "POST", {
          key: k,
          value: v,
          type: "encrypted",
          target: targets,
        });
      }
    }

    // Trigger redeploy so new env vars take effect
    let redeploy: "triggered" | "manual" = "manual";
    if (repoId) {
      const dep = await vfetch(vercelToken, "/v13/deployments", "POST", {
        name: PROJECT_NAME,
        project: projectId,
        target: "production",
        gitSource: { type: "github", repoId: String(repoId), ref: "main" },
      });
      if (dep.status === 200 || dep.status === 201) redeploy = "triggered";
    }

    return NextResponse.json({ ok: true, redeploy });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
