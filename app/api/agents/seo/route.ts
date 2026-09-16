import { NextRequest, NextResponse } from "next/server";
import { agentAuth, unauthorized } from "@/lib/agents/common";

export const dynamic = "force-dynamic";

interface SeoCheck {
  name: string;
  pass: boolean;
  hint: string;
}

function auditSeo(html: string, url: string): { score: number; checks: SeoCheck[]; suggestions: string[] } {
  const checks: SeoCheck[] = [];
  const m = (re: RegExp) => html.match(re);

  const title = m(/<title[^>]*>([^<]{1,160})<\/title>/i);
  checks.push({
    name: "Title tag",
    pass: !!title,
    hint: title ? `OK — "${title[1].trim().slice(0, 60)}"` : "Missing — har page pe unique <title> chahiye (50-60 chars).",
  });

  const desc = m(/<meta[^>]+name=["']description["'][^>]*>/i);
  const descLen = desc ? (desc[0].match(/content=["']([^"']*)["']/i)?.[1] ?? "").length : 0;
  checks.push({
    name: "Meta description",
    pass: descLen >= 50,
    hint: descLen >= 50 ? `OK — ${descLen} chars` : "Missing/weak — 120-160 chars ki unique description likho.",
  });

  checks.push({
    name: "Canonical",
    pass: /<link[^>]+rel=["']canonical["']/i.test(html),
    hint: /<link[^>]+rel=["']canonical["']/i.test(html) ? "OK" : "Missing — duplicate-content issues se bachne ke liye canonical URL lagao.",
  });

  const ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const ogDesc = /<meta[^>]+property=["']og:description["']/i.test(html);
  const ogImg = /<meta[^>]+property=["']og:image["']/i.test(html);
  checks.push({
    name: "Open Graph tags",
    pass: ogTitle && ogDesc && ogImg,
    hint: ogTitle && ogDesc && ogImg ? "OK" : `Missing: ${[!ogTitle && "og:title", !ogDesc && "og:description", !ogImg && "og:image"].filter(Boolean).join(", ")} — social share pe kharab dikhega.`,
  });

  checks.push({
    name: "Viewport (mobile)",
    pass: /<meta[^>]+name=["']viewport["']/i.test(html),
    hint: /<meta[^>]+name=["']viewport["']/i.test(html) ? "OK" : "Missing — mobile-first India me ye must hai.",
  });

  const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  checks.push({
    name: "HTML lang",
    pass: !!lang,
    hint: lang ? `OK — lang="${lang[1]}"` : "Missing — <html lang=\"en\"> (ya \"hi\") lagao.",
  });

  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  checks.push({
    name: "H1 heading",
    pass: h1 === 1,
    hint: h1 === 1 ? "OK — exactly 1 H1" : `Found ${h1} H1 tags — ideally sirf 1 per page.`,
  });

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const suggestions = checks
    .filter((c) => !c.pass)
    .map((c) => `${c.name}: ${c.hint}`);

  void url;
  return { score, checks, suggestions };
}

/**
 * SEO agent — kisi bhi public URL ka on-demand SEO audit.
 * Honest limit: audit + suggestions live hain; one-click auto-fix coming soon.
 */
export async function POST(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const raw = String(body?.url || "").trim();
  let url: URL;
  try {
    url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "Valid http(s) URL chahiye." }, { status: 400 });
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "MeraAI-SEO-Agent/1.0" },
    }).finally(() => clearTimeout(t));
    if (!r.ok) {
      return NextResponse.json({ error: `URL fetch failed — HTTP ${r.status}.` }, { status: 200 });
    }
    const html = (await r.text()).slice(0, 500_000);
    const report = auditSeo(html, url.toString());
    return NextResponse.json({ ok: true, url: url.toString(), ...report });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: `Audit failed — ${msg}` }, { status: 200 });
  }
}
