import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isOwner } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import { TEMPLATES } from "@/lib/templates";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = TEMPLATES.find((x) => x.slug === params.slug);
  if (!t) return { title: "Template not found | MeraAI" };
  return {
    title: `${t.name} — Build with AI | MeraAI`,
    description: `Build a ${t.name.toLowerCase()} with MeraAI: describe it in chat, get production-ready Next.js + Supabase code, push to your GitHub. ${t.description}`,
    openGraph: {
      title: `${t.name} — Build with AI | MeraAI`,
      description: t.description,
      type: "website",
    },
  };
}

export default function TemplateDetailPage({ params }: { params: { slug: string } }) {
  const t = TEMPLATES.find((x) => x.slug === params.slug);
  if (!t) notFound();
  if (!isOwner()) return <PasswordGate next={`/templates/${t.slug}`} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/templates" className="text-xs text-zinc-500 hover:text-white">← All templates</Link>
      <div>
        <h1 className="text-3xl font-bold">Build a {t.name} with AI ⚡</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {t.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-bold">What you get</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          <li className="flex gap-2"><span className="text-emerald-400">✓</span>Production-ready Next.js 14 + TypeScript + Tailwind code</li>
          <li className="flex gap-2"><span className="text-emerald-400">✓</span>Supabase backend with RLS security</li>
          <li className="flex gap-2"><span className="text-emerald-400">✓</span>Mobile-first design, SEO tags included</li>
          <li className="flex gap-2"><span className="text-emerald-400">✓</span>Push to your GitHub — zero lock-in, ya ZIP download</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-sm font-bold text-zinc-400">The starter prompt</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{t.prompt}</p>
      </div>

      <Link
        href={`/?prompt=${encodeURIComponent(t.prompt)}`}
        className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500"
      >
        🚀 Build this {t.name.toLowerCase()} now →
      </Link>
    </div>
  );
}
