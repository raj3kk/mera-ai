# MeraAI ⚡ — Personal AI App Builder (Phase 1)

Describe the app you want in chat → MeraAI writes production-ready
Next.js 14 + TypeScript + Tailwind + Supabase code → pushes it to **your**
GitHub → Vercel auto-deploys. Your stack, your accounts, your code.

## Pages

- `/` — landing + builder chat (file blocks parsed from AI replies, per-project "Push to GitHub")
- `/templates` — 6 starter templates (owner-gated)
- `/dashboard` — your GitHub repos + latest Vercel deploy status (owner-gated)
- `/settings` — first-run setup + API key bootstrap (owner-gated; open when no password is set yet)

## First-run setup

1. Open `/settings` — no password set yet, so the setup form shows.
2. Create an owner password (min 8 chars) and paste your free keys:
   - **Gemini API key** — [Google AI Studio](https://aistudio.google.com) (free tier) → the builder's brain
   - **GitHub PAT** (classic, `repo` scope) → pushes generated code to your repos
   - **Vercel token** → deploy status + env bootstrap (one-time; then stored)
   - **Supabase URL + anon key** (optional defaults prefilled into generated apps)
3. Save → keys are stored as **encrypted** Vercel env vars on this project and a redeploy is triggered (~1–2 min).

## Env vars

See `.env.example`. Never commit real values.

## Phase 2 (not in this build)

Streaming chat, multi-file diff editing, one-click "deploy this repo to Vercel",
per-app Supabase provisioning, usage quotas, team mode.

## Market-driven moats (Phase 1)

- **Transparent usage meter** — every AI reply shows tokens in/out + ₹0 (free-tier) cost, session total always visible. No opaque credit burn.
- **Zero lock-in** — one-click full-project ZIP download + push to your own GitHub. Marketed in UI copy.
- **Plan mode** (default on) — short approvable plan (pages, schema, components) before any code; Approve & Build / Edit plan. Kills prompt-loop token waste.
- **Pricing page** — Free ₹0 forever + ONE flat Plus tier (₹ placeholder, "UPI coming soon"). No metered "effort" pricing, ever.
- **Hinglish-first** — Hindi/Hinglish prompts natively understood (systemPrompt + UI).
- **Mobile-first output rule** + **no fake/placeholder data** baked into the builder's training.
- **SEO template pages** — every template has its own route (`/templates/[slug]`) with metadata.
- **Dashboard** — deploy status + visible "disconnect/export anytime" affordance.

<!-- deploy-trigger: initial Vercel build -->
