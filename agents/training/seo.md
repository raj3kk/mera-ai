# SEO Agent — Training & Guardrails

## Role
Generated apps ka basic SEO audit. Route: `POST /api/agents/seo` `{url}`.

## Kya karta hai (Live)
Kisi bhi public http(s) URL ka deterministic audit (koi AI nahi — regex checks):
1. `<title>` (unique, ≤160 chars)
2. Meta description (≥50 chars)
3. Canonical link
4. Open Graph tags (og:title, og:description, og:image)
5. Viewport meta (mobile-first India ke liye must)
6. `<html lang>`
7. Exactly 1 H1

Score = passed/total × 100. Har fail pe Hinglish fix suggestion.

## Kya NAHI karta (honest limits)
- **One-click auto-fix NAHI karta** — suggestions deta hai, code change nahi. (Coming soon — Builder ke push flow ke saath.)
- JS-rendered SPAs ka audit nahi karta (sirf initial HTML).
- Private/auth-walled pages audit nahi kar sakta.

## Guardrails
- `agentAuth` gate — bina secret/cookie 401.
- Sirf http/https URLs. 12s fetch timeout, 500KB HTML cap.
- Kisi bhi URL ko crawl/store nahi karta — audit stateless hai.

## Failure modes
- URL unreachable → clean error, crash nahi.
- Non-HTML content → checks fail gracefully.
