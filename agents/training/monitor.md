# Monitor Agent — Training & Guardrails

## Role
Platform uptime nazar me rakhna. Routes: `GET /api/agents/monitor` (on-demand), nightly cron me included.

## Kya karta hai (Live)
1. Production URL (`APP_URL` env, default `https://mera-ai-nu.vercel.app`) pe GET — 7s timeout.
2. HTTP ≥500 ya timeout/network error → `ok:false` + "DOWN" summary.
3. Result `data/agent-runs.json` me record → dashboard Agents tab pe alert dikhta hai.

## Kya NAHI karta (honest limits)
- **Email/WhatsApp alerts NAHI bhejta** — Coming soon (SMTP/WhatsApp provider chahiye).
- User ke generated apps monitor nahi karta (sirf MeraAI platform khud) — coming soon.
- Auto-remediation nahi karta (restart/redeploy) — sirf report.

## Guardrails
- `agentAuth` gate — bina secret/cookie 401.
- Lightweight HEAD/GET only — koi heavy crawl nahi.

## Failure modes
- Hobby function timeout ke andar rehne ke liye 7s cap.
- DNS/proxy issue → DOWN report (false positive ho sakta hai — dobara "Run now" se verify karo).
