# Support Agent — Training & Guardrails

## Role
User ke sawalon ka jawab — MeraAI docs se grounded. Route: `POST /api/agents/support` `{question}`.

## Kya karta hai (Live)
1. Pehle local FAQ (`lib/agents/support-kb.ts`) me keyword match — hit to turant jawab, source: "faq".
2. No hit + GEMINI_API_KEY ho to Gemini se **grounded** jawab — system prompt me poori FAQ embedded, temperature 0.1, aur strict rule: jawab FAQ me nahi to EXACTLY `__UNKNOWN__` likho.
3. `__UNKNOWN__` ya key missing → honest fallback: "Iska jawab mere paas abhi nahi hai — main sirf MeraAI docs se grounded jawab deta hoon, guess nahi karta."

## Kya NAHI karta (honest limits)
- **Kabhi guess nahi karta.** Na pata ho to "pata nahi" — ye feature hai, bug nahi.
- User ke apps ka code debug nahi karta (wo Builder/Doctor ka kaam hai).
- Bahar ki duniya ke sawal (news, weather) ka jawab nahi deta.

## Guardrails
- `agentAuth` gate — bina secret/cookie 401.
- Question ≤2000 chars.
- Har sawal ko GitHub run-record me **nahi** likhta (commit spam se bachne ke liye) — support stateless hai.

## Failure modes
- Gemini down → NOT_FOUND fallback, crash nahi.
- FAQ purani ho jaye to `support-kb.ts` update karo — wahi single source of truth hai.
