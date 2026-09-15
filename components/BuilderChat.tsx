"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface GenFile {
  path: string;
  content: string;
}

const FILE_BLOCK_RE = /```filepath:([^\n`]+)\n([\s\S]*?)```/g;

function parseFiles(reply: string): GenFile[] {
  const files: GenFile[] = [];
  const re = new RegExp(FILE_BLOCK_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(reply)) !== null) {
    const path = m[1].trim().replace(/^\.\//, "").replace(/^\/+/, "");
    if (!path || path.includes("..")) continue;
    files.push({ path, content: m[2].replace(/\n$/, "") });
  }
  return files;
}

function stripFiles(reply: string): string {
  return reply.replace(new RegExp(FILE_BLOCK_RE, "g"), "").trim();
}

export default function BuilderChat() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState("my-app");
  const [branch, setBranch] = useState("main");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = params.get("prompt");
    if (p) setInput(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const lastFiles: GenFile[] =
    messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? parseFiles(messages[messages.length - 1].content)
      : [];

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPushResult(null);
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await r.json();
      if (data.error) {
        setMessages([...next, { role: "assistant", content: `⚠️ ${data.error}` }]);
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "⚠️ Network error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function pushToGitHub() {
    if (lastFiles.length === 0 || pushing) return;
    setPushing(true);
    setPushResult(null);
    try {
      const r = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repo.trim(),
          branch: branch.trim() || "main",
          message: "MeraAI build",
          files: lastFiles,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setPushResult(`✅ Pushed ${data.files} files → ${data.repo}@${data.branch}\n${data.url}`);
      } else {
        setPushResult(`❌ ${data.error || "Push failed."}`);
      }
    } catch {
      setPushResult("❌ Network error during push.");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Chat column */}
      <div className="flex min-h-[560px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="chat-scroll flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: 560 }}>
          {messages.length === 0 && (
            <div className="mt-16 text-center text-sm text-zinc-500">
              <p className="text-lg">👋 Batao, kya banana hai?</p>
              <p className="mt-2">Example: “Mujhe login wala todo app chahiye”</p>
              <p className="mt-1">Ya <a className="text-emerald-400 underline" href="/templates">templates</a> me se ek chuno.</p>
            </div>
          )}
          {messages.map((m, i) => {
            const files = m.role === "assistant" ? parseFiles(m.content) : [];
            const text = m.role === "assistant" ? stripFiles(m.content) : m.content;
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-200"
                  }`}
                >
                  {text && <p className="whitespace-pre-wrap">{text}</p>}
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                        📁 {files.length} files generated
                      </p>
                      {files.map((f) => (
                        <div key={f.path} className="rounded-lg border border-zinc-800 bg-zinc-950">
                          <button
                            className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-xs text-zinc-300"
                            onClick={() =>
                              setExpanded((e) => ({ ...e, [f.path]: !e[f.path] }))
                            }
                          >
                            <span className="truncate">{f.path}</span>
                            <span className="ml-2 text-zinc-500">{expanded[f.path] ? "▾" : "▸"}</span>
                          </button>
                          {expanded[f.path] && (
                            <pre className="max-h-64 overflow-auto border-t border-zinc-800 p-3 font-mono text-[11px] text-zinc-400">
                              {f.content}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                ⚡ MeraAI code likh raha hai…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-zinc-800 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Apne app ka idea likho… (Enter = send)"
              className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Push panel */}
      <div className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-bold">🚀 Push to GitHub</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Latest AI reply se files lekar tumhare repo me push karega. Repo naya ho to bana diya jayega.
        </p>
        <label className="mt-4 block text-xs text-zinc-400">Repo name</label>
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="my-app"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
        />
        <label className="mt-3 block text-xs text-zinc-400">Branch</label>
        <input
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="main"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
        />
        <button
          onClick={pushToGitHub}
          disabled={pushing || lastFiles.length === 0}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {pushing ? "Pushing…" : `Push ${lastFiles.length} files`}
        </button>
        {pushResult && (
          <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
            {pushResult}
          </pre>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
          Push ke baad: GitHub repo ko Vercel me import karo (ek baar) — uske baad har push pe auto-deploy.
        </p>
      </div>
    </div>
  );
}
