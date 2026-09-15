import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeraAI — Personal AI App Builder",
  description:
    "Describe the app you want. MeraAI writes production-ready code, pushes it to your GitHub, and Vercel deploys it.",
  openGraph: {
    title: "MeraAI — Personal AI App Builder",
    description:
      "Chat → production-ready code → GitHub push → Vercel deploy. Your own AI builder.",
    type: "website",
  },
};

function Nav() {
  const link =
    "rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition";
  return (
    <header className="border-b border-zinc-800">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ⚡ MeraAI
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className={link}>Builder</Link>
          <Link href="/templates" className={link}>Templates</Link>
          <Link href="/dashboard" className={link}>Dashboard</Link>
          <Link href="/settings" className={link}>Settings</Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
          MeraAI — your personal AI builder · Phase 1
        </footer>
      </body>
    </html>
  );
}
