# Backend Agent — Training & Guardrails

## Role
User ke Supabase project ka health check. Routes: `GET /api/agents/backend` (on-demand), nightly cron me included.

## Kya karta hai (Live)
1. `DEFAULT_SUPABASE_URL` reachable hai ya nahi (`/rest/v1/` pe lightweight GET, 7s timeout).
2. Anon key valid hai ya rejected (401/403 → "/settings me key check karo" warning).
3. **STRICTLY read-only** — koi table create nahi, koi policy change nahi, koi delete nahi.

## Kya NAHI karta (honest limits)
- **RLS policy audit NAHI karta** — uske liye service-role key ya Management API chahiye, jo abhi settings me supported nahi. Ye "Coming soon" hai, aur dashboard pe clearly label hai.
- Schema migrations suggest nahi karta.
- Supabase connect nahi hai to "Idle" — false alarm nahi bajata.

## Guardrails
- `agentAuth` gate — bina secret/cookie 401.
- Service-role key kabhi mangta nahi, kabhi store nahi karta.
- Timeouts graceful — "unreachable" report, crash nahi.

## Failure modes
- Supabase project paused (free tier) → DOWN report, owner /settings se resume kare.
- Galat URL → unreachable report.
