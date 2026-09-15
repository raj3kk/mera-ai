import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";

async function ghGet(path: string, token: string) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mera-ai",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!r.ok) return null;
  return r.json();
}

async function vercelGet(path: string, token: string) {
  const r = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

export async function GET() {
  if (!isOwner()) {
    return NextResponse.json({ error: "Owner login required." }, { status: 401 });
  }
  const ghToken = process.env.GH_TOKEN;
  if (!ghToken) {
    return NextResponse.json(
      { error: "GH_TOKEN not configured. Add it in /settings." },
      { status: 200 }
    );
  }

  const repos = await ghGet("/user/repos?per_page=100&sort=updated&affiliation=owner", ghToken);
  if (!repos) {
    return NextResponse.json({ error: "GitHub API failed. Check GH_TOKEN in /settings." }, { status: 200 });
  }

  // Map repo full_name -> Vercel project id
  const projByRepo = new Map<string, string>();
  const vercelToken = process.env.VERCEL_TOKEN;
  if (vercelToken) {
    const projs = await vercelGet("/v9/projects?limit=100", vercelToken);
    for (const p of projs?.projects ?? []) {
      if (p?.link?.repo) projByRepo.set(p.link.repo, p.id);
    }
  }

  const list = (repos as any[]).slice(0, 30).map((r) => ({
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    language: r.language ?? null,
    updated_at: r.updated_at,
    deploy: null as null | { state: string; url: string; createdAt: number },
  }));

  if (vercelToken) {
    await Promise.all(
      list.map(async (item) => {
        const pid = projByRepo.get(item.full_name);
        if (!pid) return;
        const d = await vercelGet(`/v6/deployments?projectId=${pid}&limit=1`, vercelToken);
        const dep = d?.deployments?.[0];
        if (dep) {
          item.deploy = { state: dep.state, url: dep.url, createdAt: dep.createdAt };
        }
      })
    );
  }

  return NextResponse.json({ projects: list });
}
