# Vercel Cron Jobs — Limits & Design Notes

## Hobby plan limits (verified 2026-09-16)
- **Max 2 cron jobs** per project.
- Har cron **sirf once per day** trigger hota hai.
- Execution timeout ≈ serverless function limit (**~10s**) — isliye nightly route me har check pe 7s cap hai aur 4 checks parallel chalte hain.
- Cron request me Vercel **automatically** `Authorization: Bearer $CRON_SECRET` header bhejta hai (jab `CRON_SECRET` env var project me set ho). `vercel.json` me secret dalne ki zaroorat nahi — aur dalna bhi mat (git me leak hoga).

## Current setup (1 of 2 slots used)
| Cron | Schedule (UTC) | Kya karta hai |
|---|---|---|
| `GET /api/agents/nightly` | `0 9 * * *` (14:30 IST) | monitor + doctor + backend + guard — parallel, single run-record commit |

Dusra slot **free** rakha hai — future use (e.g. weekly SEO digest ya builder queue drain).

## Run records
- Har cron run `data/agent-runs.json` me record hota hai (GitHub Contents API, single read-modify-write).
- Commit message me **`[skip ci]`** — taaki Vercel deploy trigger na ho (100/day deployment budget bachao).
- GH_TOKEN missing ho to persistence silently skip — run ka result phir bhi response me milta hai.

## Manual runs
Dashboard → Agents tab → "Run now" (owner cookie se auth). Ya `curl` with `Authorization: Bearer $CRON_SECRET`.

## Pro upgrade path
Pro plan: 40 crons, unlimited frequency/day, longer timeouts. Tab jaake:
1. `vercel.json` me alag-alag crons banao (monitor hourly, doctor daily, etc.)
2. `maxDuration` badhao lambi builder jobs ke liye
3. Dusre slot ka use karo

## Deployment budget note
Ye repo GitHub-push pe auto-deploy hota hai. Agent run-record commits `[skip ci]` use karte hain — real code commits kabhi `[skip ci]` nahi lagate.
