import Link from "next/link";
import { isOwner } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import { TEMPLATES } from "@/lib/templates";

export default function TemplatesPage() {
  if (!isOwner()) return <PasswordGate next="/templates" />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧩 Templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ek click me builder chat me prompt bharo — phir Send dabao.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.slug} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-bold">{t.name}</h2>
            <p className="mt-1 flex-1 text-sm text-zinc-400">{t.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={`/templates/${t.slug}`}
              className="mt-4 rounded-xl bg-zinc-800 py-2 text-center text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
            >
              View details →
            </Link>
            <Link
              href={`/?prompt=${encodeURIComponent(t.prompt)}`}
              className="mt-2 rounded-xl bg-emerald-600 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Use template →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
