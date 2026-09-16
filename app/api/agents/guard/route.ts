import { NextRequest, NextResponse } from "next/server";
import { agentAuth, unauthorized } from "@/lib/agents/common";
import { scanSecrets, screenPrompt } from "@/lib/agents/guardlib";

export const dynamic = "force-dynamic";

/**
 * Guard agent —
 * POST {action:"scan", files:[{path,content}]} → generated code me secret scan
 * POST {action:"screen", text} → prompt-injection screening
 * GET → guardrails status (booleans only — values kabhi expose nahi hote)
 */
export async function POST(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();

  let body: { action?: string; files?: { path: string; content: string }[]; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body?.action === "scan") {
    const files = (Array.isArray(body.files) ? body.files : [])
      .slice(0, 60)
      .map((f) => ({ path: String(f.path || ""), content: String(f.content || "").slice(0, 200_000) }));
    const findings = scanSecrets(files);
    const blocking = findings.filter((f) => f.blocking);
    return NextResponse.json({
      ok: true,
      scanned: files.length,
      findings,
      blocking: blocking.length,
      verdict: blocking.length > 0 ? "BLOCK" : "PASS",
      note: "generic-secret findings warning hain (false positive ho sakta hai); blocking kinds pe push roko.",
    });
  }

  if (body?.action === "screen") {
    const text = String(body?.text || "").slice(0, 20000);
    const flags = screenPrompt(text);
    return NextResponse.json({
      ok: true,
      flags,
      verdict: flags.length > 0 ? "BLOCK" : "PASS",
    });
  }

  return NextResponse.json({ error: 'action must be "scan" or "screen".' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();
  return NextResponse.json({
    ok: true,
    guardrails: {
      cronSecretSet: !!process.env.CRON_SECRET,
      ownerPasswordSet: !!process.env.OWNER_PASSWORD,
      encryptionKeySet: !!process.env.ENCRYPTION_KEY,
    },
    endpoints: {
      scan: "POST /api/agents/guard {action:'scan', files:[{path,content}]}",
      screen: "POST /api/agents/guard {action:'screen', text}",
    },
    note: "Builder har push se pehle scan+screen automatically chalata hai. Persistent cross-instance rate limiting: coming soon.",
  });
}
