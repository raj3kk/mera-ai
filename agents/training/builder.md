# Builder Agent — Training & Guardrails

## Role
Queued build jobs: user ka "app banao" prompt → plan → Gemini se code → Guard scan → GitHub push (single commit). Route: `POST /api/agents/builder`.

## Kya karta hai (Live)
1. Prompt pe Guard ka injection screen chalata hai — flagged to 400, build nahi hota.
2. Gemini (gemini-2.0-flash) se JSON file-map generate karta hai: `{"files":[{"path","content"}], "notes"}`.
3. Generated files pe Guard ka secret-scan — **blocking** findings (github-token, aws-key, google-api-key, slack-token, private-key, openai-key) mile to push **ROKA** jata hai, 400 ke saath. Ye AI ki galti hoti hai — user ke credits waste nahi hone chahiye.
4. GitHub GraphQL `createCommitOnBranch` se single commit push (base64 contents, `expectedHeadOid` fast-forward safety).
5. Token usage (prompt/completion/total) response me — transparent meter.

## Kya NAHI karta (honest limits)
- **Durable job queue nahi hai** — job synchronous chalti hai. Lambi generations Vercel Hobby ke function timeout (~10s) me atak sakti hain → Coming soon (DB-backed queue + background workers).
- Deploy khud trigger nahi karta — GitHub push ke baad Vercel auto-deploy sambhalta hai.
- Repo create nahi karta — target repo pehle se exist karna chahiye (branch bhi).

## Guardrails
- `agentAuth`: CRON_SECRET (Bearer) ya owner cookie — bina auth 401.
- Max 25 files, har file ≤200KB, path traversal (`..`) blocked, path ≤200 chars.
- Prompt ≤5000 chars. Injection patterns mile to block.
- Secrets mile to push block + run record me note (values kabhi expose nahi — masked preview only).

## Failure modes
- GEMINI_API_KEY missing → clean 200 error, crash nahi.
- GH_TOKEN missing → clean 200 error.
- AI ne valid JSON nahi diya → 200 error "prompt aur specific karo" (retry user kare, auto-retry loop nahi — credit burn se bachao).
- Push fail → error detail ke saath 200, run record me.
