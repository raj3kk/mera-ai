import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";

const GH = "https://api.github.com";

async function gh(path: string, token: string, method = "GET", body?: unknown) {
  const r = await fetch(GH + path, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mera-ai",
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON */
  }
  return { status: r.status, json };
}

interface PushFile {
  path: string;
  content: string;
}

function cleanPath(p: string): string | null {
  const c = String(p || "").trim().replace(/^\.\//, "").replace(/^\/+/, "");
  if (!c || c.includes("..") || c.length > 200) return null;
  return c;
}

export async function POST(req: NextRequest) {
  if (!isOwner()) {
    return NextResponse.json({ error: "Owner login required." }, { status: 401 });
  }
  const token = process.env.GH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GH_TOKEN not configured. Add your GitHub PAT in /settings." },
      { status: 200 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const branch = String(body?.branch || "main").trim() || "main";
  const message = String(body?.message || "MeraAI build").slice(0, 200);
  const rawFiles: PushFile[] = Array.isArray(body?.files) ? body.files : [];
  const files = rawFiles
    .map((f) => ({ path: cleanPath(f.path), content: String(f.content ?? "") }))
    .filter((f) => f.path && f.content.length <= 200_000) as { path: string; content: string }[];

  if (files.length === 0) return NextResponse.json({ error: "No valid files to push." }, { status: 400 });
  if (files.length > 60) return NextResponse.json({ error: "Too many files (max 60 per push)." }, { status: 400 });

  let repoInput = String(body?.repo || "").trim();
  if (!repoInput) return NextResponse.json({ error: "Repo name required." }, { status: 400 });

  // Resolve owner when only a repo name is given
  let full = repoInput;
  if (!repoInput.includes("/")) {
    const me = await gh("/user", token);
    if (me.status !== 200 || !me.json?.login) {
      return NextResponse.json({ error: "Could not resolve GitHub user for this token." }, { status: 200 });
    }
    full = `${me.json.login}/${repoInput}`;
  }

  // Ensure repo exists (create public if missing)
  const repoCheck = await gh(`/repos/${full}`, token);
  if (repoCheck.status === 404) {
    const name = full.split("/")[1];
    const created = await gh("/user/repos", token, "POST", {
      name,
      private: false,
      description: "Built with MeraAI ⚡",
      auto_init: false,
    });
    if (created.status !== 201) {
      return NextResponse.json(
        { error: `Repo not found and auto-create failed (HTTP ${created.status}). Create it on GitHub first.` },
        { status: 200 }
      );
    }
  } else if (repoCheck.status !== 200) {
    return NextResponse.json({ error: `GitHub repo check failed (HTTP ${repoCheck.status}).` }, { status: 200 });
  }

  // Current branch tip (if any)
  let parentSha: string | null = null;
  let baseTree: string | null = null;
  const ref = await gh(`/repos/${full}/git/ref/heads/${branch}`, token);
  if (ref.status === 200 && ref.json?.object?.sha) {
    parentSha = ref.json.object.sha;
    const commit = await gh(`/repos/${full}/git/commits/${parentSha}`, token);
    if (commit.status === 200) baseTree = commit.json.tree.sha;
  }

  // Create blobs
  const blobs = await Promise.all(
    files.map(async (f) => {
      const b = await gh(`/repos/${full}/git/blobs`, token, "POST", {
        content: f.content,
        encoding: "utf-8",
      });
      if (b.status !== 201 || !b.json?.sha) throw new Error(`Blob failed for ${f.path}`);
      return { path: f.path, sha: b.json.sha };
    })
  );

  // Create tree
  const treeRes = await gh(`/repos/${full}/git/trees`, token, "POST", {
    ...(baseTree ? { base_tree: baseTree } : {}),
    tree: blobs.map((b) => ({ path: b.path, mode: "100644", type: "blob", sha: b.sha })),
  });
  if (treeRes.status !== 201 || !treeRes.json?.sha) {
    return NextResponse.json({ error: "Could not create git tree." }, { status: 200 });
  }

  // Create commit
  const commitRes = await gh(`/repos/${full}/git/commits`, token, "POST", {
    message,
    tree: treeRes.json.sha,
    parents: parentSha ? [parentSha] : [],
  });
  if (commitRes.status !== 201 || !commitRes.json?.sha) {
    return NextResponse.json({ error: "Could not create commit." }, { status: 200 });
  }
  const sha: string = commitRes.json.sha;

  // Move/create branch ref
  if (parentSha) {
    const upd = await gh(`/repos/${full}/git/refs/heads/${branch}`, token, "PATCH", { sha });
    if (upd.status !== 200) return NextResponse.json({ error: "Commit created but branch update failed." }, { status: 200 });
  } else {
    const mk = await gh(`/repos/${full}/git/refs`, token, "POST", {
      ref: `refs/heads/${branch}`,
      sha,
    });
    if (mk.status !== 201) return NextResponse.json({ error: "Commit created but branch creation failed." }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    repo: full,
    branch,
    files: files.length,
    commit: sha.slice(0, 7),
    url: `https://github.com/${full}/commit/${sha}`,
  });
}
