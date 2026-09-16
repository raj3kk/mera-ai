import { NextRequest, NextResponse } from "next/server";
import { agentAuth, unauthorized } from "@/lib/agents/common";
import { FAQ, findFaq, NOT_FOUND } from "@/lib/agents/support-kb";

export const dynamic = "force-dynamic";

async function geminiGrounded(key: string, question: string): Promise<string> {
  const faqText = FAQ.map((f) => `Q: ${f.keys.join(", ")}\nA: ${f.a}`).join("\n\n");
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `Tum MeraAI Support agent ho. Neeche FAQ hai. User ke sawal ka jawab SIRF is FAQ se do, Hinglish me, short me. Agar jawab FAQ me nahi hai to EXACTLY ye likho: __UNKNOWN__. Kabhi guess mat karo, kabhi bahar ki knowledge mat jodo.\n\n${faqText}`,
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
      }),
    }
  );
  if (!r.ok) throw new Error(`Gemini API error (HTTP ${r.status})`);
  const data = await r.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("")?.trim() ?? "";
  return text.includes("__UNKNOWN__") ? NOT_FOUND : text || NOT_FOUND;
}

/**
 * Support agent — FAQ-grounded jawab. Jo docs me nahi, uska jawab "pata nahi".
 * (Support ke har sawal ko GitHub me record nahi karte — commit spam se bachne ke liye.)
 */
export async function POST(req: NextRequest) {
  if (!agentAuth(req)) return unauthorized();

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const question = String(body?.question || "").slice(0, 2000).trim();
  if (!question) return NextResponse.json({ error: "question required." }, { status: 400 });

  const hit = findFaq(question);
  if (hit) {
    return NextResponse.json({ ok: true, answer: hit.a, source: "faq" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, answer: NOT_FOUND, source: "none" });
  }
  try {
    const answer = await geminiGrounded(key, question);
    return NextResponse.json({ ok: true, answer, source: "gemini-grounded" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: true, answer: NOT_FOUND, source: "error", note: msg });
  }
}
