export interface Faq {
  keys: string[];
  a: string;
}

/** MeraAI knowledge base — Support agent SIRF isi se grounded jawab deta hai. */
export const FAQ: Faq[] = [
  {
    keys: ["kya hai", "what is", "meraai", "ye kya"],
    a: "MeraAI tumhara personal AI app-builder hai: tum chat me app describe karo, AI code likhta hai, tumhare GitHub pe push hota hai, Vercel se deploy hota hai. Code, repo aur data — sab tumhara, koi lock-in nahi.",
  },
  {
    keys: ["github", "connect"],
    a: "/settings kholo → 'Connect with GitHub' dabao → GitHub pe Allow karo. Bas — koi key copy-paste nahi. (Pehli baar owner ko GitHub me ek OAuth App banana hota hai — steps /settings pe Hinglish me hain.)",
  },
  {
    keys: ["key", "kahan", "safe", "surakshit", "token dalna"],
    a: "API keys kabhi chat me mat bhejo. /settings pe owner password se login karke daalo — wahan se seedha Vercel ke encrypted env vars me save hoti hain, repo me kabhi commit nahi hoti.",
  },
  {
    keys: ["code", "mera", "ownership", "lock", "export"],
    a: "Haan — 100% tumhara. Har build tumhare GitHub repo me push hota hai, chaaho to ZIP download karke kahin bhi deploy karo. MeraAI chhodne pe kuch nahi khota — migration tax zero.",
  },
  {
    keys: ["price", "paisa", "cost", "free", "kitne ka"],
    a: "MeraAI free-start pe bana hai (Gemini free tier + Vercel Hobby). Paid plan aane pe single flat tier hoga, ₹ pricing ke saath — koi metered 'effort' billing nahi. Har generation ka token usage dashboard me transparent dikhta hai.",
  },
  {
    keys: ["hindi", "hinglish", "bhasha"],
    a: "Haan! Tum Hindi ya Hinglish me prompt likh sakte ho — AI samajhta hai. Baatcheet tumhari bhasha me, code standard English me.",
  },
  {
    keys: ["fail", "error", "build nahi", "deploy nahi"],
    a: "Agar build/deploy fail ho to Doctor agent automatically check karta hai (dashboard → Agents tab). Fix suggest hota hai; auto-fix abhi coming soon hai. Credit-burn se bachne ke liye retry cap hai.",
  },
  {
    keys: ["supabase", "database", "backend"],
    a: "Apna Supabase project /settings se connect karo (Project URL + anon key). AI usi pe schema banayega. RLS policy audit feature coming soon hai.",
  },
  {
    keys: ["domain", "custom"],
    a: "Vercel project settings me custom domain add kar sakte ho — repo tumhara hai, Vercel project tumhara hai.",
  },
  {
    keys: ["disconnect", "hatana", "delete", "nikalna"],
    a: "/settings se kabhi bhi keys hata sakte ho. Repo GitHub pe tumhara rehta hai — disconnect ka matlab sirf MeraAI ka access khatm, tumhara code/data safe.",
  },
  {
    keys: ["credit", "limit", "quota", "khatm"],
    a: "Har generation pe token usage transparent meter me dikhta hai. Gemini free tier ka daily quota Google ki taraf se hota hai — quota khatm ho to thoda ruk ke retry karo. Debugging loops me credits udne se bachne ke liye Plan Mode use karo.",
  },
  {
    keys: ["agent", "kaun"],
    a: "MeraAI me 7 agents hain — Builder, Doctor, Backend, Support, Monitor, SEO, Guard. Dashboard → Agents tab me har ek ka status, last run aur honest capability label dikhta hai (Live vs Coming soon).",
  },
];

export function findFaq(q: string): Faq | null {
  const t = q.toLowerCase();
  let best: Faq | null = null;
  let bestScore = 0;
  for (const f of FAQ) {
    let s = 0;
    for (const k of f.keys) if (t.includes(k)) s += k.length;
    if (s > bestScore) {
      bestScore = s;
      best = f;
    }
  }
  return bestScore >= 4 ? best : null;
}

export const NOT_FOUND =
  "Iska jawab mere paas abhi nahi hai — main sirf MeraAI docs se grounded jawab deta hoon, guess nahi karta.";
