import { NextRequest, NextResponse } from "next/server";
import { agentAuth, recordRun, unauthorized } from "@/lib/agents/common";
import { scanSecrets, screenPrompt } from "@/lib/agents/guardlib";
import { SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";

export const dynamic = "force-dynamic";

const MODEL = "gemini-2.0-flash";

const BUILD_INSTRUCTION = `
Tum MeraAI Builder ho. User ke prompt se ek chhota production-ready web project banao.
RULES:
- Output SIRF valid JSON ho — koi markdown fencing nahi, koi extra text nahi.
- Format: {"files":[{"path":"index.html","content":"..."}, ...], "notes":"short Hinglish note"}
- Max 25 files. Har file ka content COMPLETE ho — no placeholders, no lorem ipsum, no fake data.
- Static site preferred (index.html + style.css + app.js) taaki kahin bhi deploy ho sake.
- Mobile-first responsive. Clean, modern design.
- Kabhi API keys, tokens ya secrets generate mat karo.
`;

function extractJson(text: string): { files?: { path: string; content: string }[]; notes?: string } | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cand = fenced ? fenced[1] : text;
  const start = cand.indexOf("{");
  const end = cand.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cand.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanPath(p: string): string | null {
  const c = String(p || "")
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  if (!c || c.includes("..") || c.length > 200) return null;
  return c;
}

async function gemini(key: string, system: string, user: string): Promise<{ text: string; usage: { prompt: number; completion: number; total: number } }> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    }
  );
  if (!r.ok) throw new Error(`Gemini API error (HTTP ${r.status})`);
  const data = await r.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ?? "";
  const um = data?.usageMetadata;
  return {
    text,
    usage: {
      prompt: um?.promptTokenCount ?? 0,
      completion: um?.candidatesTokenCount ?? 0,
      total: um?.totalTokenCount ?? 0,
    },
  };
}

async function ghGraphql(token: string, query: string, variables: unknown) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "mera-ai",
    },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

/**
 * Builder agent — queued build job: prompt → code (Gemini) → Guard scan → GitHub push.
 * Honest limits: synchronous hai; lambi builds Hobby ke function timeout me atak
 * sakti hain (durable queue = coming soon). Secrets mile to push BLOCK hota hai.
 */
export async function POST(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();

  let body: { prompt?: string; repo?: string; branch?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = String(body?.prompt || "").slice(0, 5000).trim();
  if (!prompt) return NextResponse.json({ error: "prompt required." }, { status: 400 });

  // 1. Guard: prompt-injection screen
  const flags = screenPrompt(prompt);
  if (flags.length > 0) {
    await recordRun("builder", {
      ok: false,
      summary: "Blocked by Guard — prompt me injection pattern mila.",
      detail: { flags },
    });
    return NextResponse.json(
      { error: "Prompt Guard ne block kiya — injection pattern detect hua.", flags },
      { status: 400 }
    );
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. /settings me free key add karo." },
      { status: 200 }
    );
  }
  const ghToken = process.env.GH_TOKEN;
  if (!ghToken) {
    return NextResponse.json(
      { error: "GH_TOKEN not configured. /settings me GitHub connect karo." },
      { status: 200 }
    );
  }

  // 2. Generate
  let gen: { text: string; usage: { prompt: number; completion: number; total: number } };
  try {
    gen = await gemini(key, SYSTEM_PROMPT + "\n" + BUILD_INSTRUCTION, prompt);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "generation failed";
    await recordRun("builder", { ok: false, summary: `Generation failed — ${msg}` });
    return NextResponse.json({ error: msg }, { status: 200 });
  }
  const parsed = extractJson(gen.text);
  const rawFiles = Array.isArray(parsed?.files) ? parsed.files : [];
  const files = rawFiles
    .map((f) => ({ path: cleanPath(f.path), content: String(f.content ?? "") }))
    .filter((f) => f.path && f.content && f.content.length <= 200_000)
    .slice(0, 25) as { path: string; content: string }[];
  if (files.length === 0) {
    await recordRun("builder", { ok: false, summary: "AI se valid file list nahi mili." });
    return NextResponse.json(
      { error: "AI se valid file list nahi mili — prompt thoda aur specific karo." },
      { status: 200 }
    );
  }

  // 3. Guard: secret scan — blocking findings mile to push ROKO
  const findings = scanSecrets(files);
  const blocking = findings.filter((f) => f.blocking);
  if (blocking.length > 0) {
    await recordRun("builder", {
      ok: false,
      summary: `Blocked: ${blocking.length} secret(s) mile — push roka gaya.`,
      detail: { findings: blocking },
    });
    return NextResponse.json(
      {
        error: "Guard ne push roka — generated code me secrets mile. Ye AI ki galti hai, tumhare credits waste nahi honge.",
        findings: blocking,
      },
      { status: 400 }
    );
  }

  // 4. Push via GitHub (single commit)
  let repoInput = String(body?.repo || "").trim();
  if (!repoInput) {
    return NextResponse.json({ error: "Target repo chahiye (e.g. username/my-app)." }, { status: 400 });
  }
  let full = repoInput;
  if (!repoInput.includes("/")) {
    const me = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${ghToken}`, "User-Agent": "mera-ai" },
    }).then((r) => r.json());
    if (!me?.login) {
      return NextResponse.json({ error: "GitHub token se user resolve nahi hua." }, { status: 200 });
    }
    full = `${me.login}/${repoInput}`;
  }
  const branch = String(body?.branch || "main").trim() || "main";

  const ref = await fetch(`https://api.github.com/repos/${full}/git/ref/heads/${branch}`, {
    headers: { Authorization: `Bearer ${ghToken}`, "User-Agent": "mera-ai" },
  }).then((r) => (r.ok ? r.json() : null));
  const tip: string | undefined = ref?.object?.sha;

  const gql = await ghGraphql(
    ghToken,
    `mutation($input:CreateCommitOnBranchInput!){createCommitOnBranch(input:$input){commit{oid}}}`,
    {
      input: {
        branch: { repositoryNameWithOwner: full, branchName: branch },
        message: { headline: `MeraAI builder: ${prompt.slice(0, 80)}` },
        fileChanges: {
          additions: files.map((f) => ({
            path: f.path,
            contents: Buffer.from(f.content).toString("base64"),
          })),
        },
        ...(tip ? { expectedHeadOid: tip } : {}),
      },
    }
  );
  const oid: string | undefined = gql?.data?.createCommitOnBranch?.commit?.oid;
  if (!oid) {
    const errMsg = JSON.stringify(gql?.errors ?? gql).slice(0, 300);
    await recordRun("builder", { ok: false, summary: `GitHub push failed — ${errMsg}` });
    return NextResponse.json({ error: `GitHub push failed: ${errMsg}` }, { status: 200 });
  }

  const warnings = findings.filter((f) => !f.blocking);
  await recordRun("builder", {
    ok: true,
    summary: `${files.length} files → ${full}@${branch} (commit ${oid.slice(0, 7)}).`,
    detail: { repo: full, branch, commit: oid, usage: gen.usage, notes: parsed?.notes },
  });
  return NextResponse.json({
    ok: true,
    repo: full,
    branch,
    commit: oid,
    files: files.length,
    notes: parsed?.notes || "",
    usage: gen.usage,
    warnings,
  });
}
