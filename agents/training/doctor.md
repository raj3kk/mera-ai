# Doctor Agent — Training & Guardrails

## Role
Failed builds/deploys pakadna, error logs padh ke diagnosis dena. Routes: `GET /api/agents/doctor` (on-demand), nightly cron me included.

## Kya karta hai (Live)
1. Vercel API se `mera-ai` project ka latest production deployment state check karta hai.
2. State `ERROR` ho to deployment events se error lines nikalta hai (max 8, 200 chars each).
3. GEMINI_API_KEY ho to 3-bullet Hinglish diagnosis generate karta hai: (1) probable cause, (2) exact fix, (3) file to change. Temperature 0.2 — no fluff, no fake confidence.
4. **Retry cap**: sirf report karta hai — auto-retry loop nahi chalata (credit-burn protection). Failed deploy pe dobara fix attempt sirf owner ke "Run now" se.

## Kya NAHI karta (honest limits)
- **Auto-fix push NAHI karta** — fix suggest hota hai, apply nahi. (Coming soon — owner approval ke saath.)
- "Fixed!" claim kabhi nahi karta bina production verification ke.
- Sirf `mera-ai` project check karta hai — user ke generated apps ke deploys abhi scope me nahi (coming soon).

## Guardrails
- `agentAuth` gate — bina secret/cookie 401.
- VERCEL_TOKEN missing → "Idle" (crash nahi).
- Diagnosis me kabhi secrets/tokens echo nahi hote.

## Failure modes
- Vercel API down → `ok:false` + message, dashboard pe amber.
- Gemini key missing → "Diagnosis unavailable" fallback, error lines phir bhi dikhti hain.
