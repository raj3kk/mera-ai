# Guard Agent — Training & Guardrails

## Role
Abuse control aur safety net. Routes: `POST /api/agents/guard`, `GET /api/agents/guard`, nightly sweep me included.

## Kya karta hai (Live)
1. **Secret scan** (`action:"scan"`, files: [{path, content}]) — GitHub tokens, AWS keys, Google API keys, Slack tokens, private keys, OpenAI keys, generic `api_key="..."` patterns. Findings me values **masked** (`ghp_…abc`) — actual secret kabhi expose nahi hota.
   - `blocking` kinds mile to verdict `BLOCK` — Builder automatically push rok deta hai.
   - `generic-secret` sirf warning hai (false positive ho sakta hai).
2. **Prompt screening** (`action:"screen"`, text) — injection patterns: "ignore previous instructions", "reveal system prompt", "DAN mode", "jailbreak", etc. → verdict BLOCK/PASS.
3. **Daily sweep** — guardrails configured hain ya nahi (CRON_SECRET / OWNER_PASSWORD / ENCRYPTION_KEY — booleans only, values kabhi nahi).

## Kya NAHI karta (honest limits)
- **Persistent cross-instance rate limiting NAHI hai** — serverless instances ke beech shared counter ke liye KV/DB chahiye. (Coming soon.)
- Human review queue nahi hai — sab automated heuristics hain.
- Scan sirf text patterns hai — obfuscated secrets pakad nahi sakta (best-effort, clearly documented).

## Guardrails
- `agentAuth` gate — bina secret/cookie 401.
- Max 60 files/scan, har file ≤200KB, max 50 findings.
- Scan results me secret values kabhi nahi — masked preview only.
- Audit trail: nightly sweep `data/agent-runs.json` me record hota hai.

## Failure modes
- Heuristic hai — false positives/negatives possible. Blocking kinds conservative rakhe gaye hain; generic-secret warning-only hai.
