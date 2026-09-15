import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, PLAN_PROMPT } from "@/lib/ai/systemPrompt";
import { isOwner } from "@/lib/auth";

const MODEL = "gemini-2.0-flash";

export interface Usage {
  prompt: number;
  completion: number;
  total: number;
}

export async function POST(req: NextRequest) {
  if (!isOwner()) {
    return NextResponse.json(
      { error: "Owner login required — unlock via /settings first." },
      { status: 401 }
    );
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. Add your free Google AI Studio key in /settings." },
      { status: 200 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array required." }, { status: 400 });
  }

  const contents = messages.slice(-20).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "").slice(0, 20000) }],
  }));

  // Plan mode: short approvable plan first, full code only after approval.
  const planMode = body?.planMode === true;
  const instruction = planMode ? PLAN_PROMPT : SYSTEM_PROMPT;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: instruction }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      }
    );
    if (!r.ok) {
      return NextResponse.json(
        { error: `Gemini API error (HTTP ${r.status}). Check your key in /settings, or the free-tier quota.` },
        { status: 200 }
      );
    }
    const data = await r.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") ?? "";
    if (!text.trim()) {
      return NextResponse.json({ error: "Empty response from Gemini. Try again." }, { status: 200 });
    }
    // Transparent usage meter — every generation reports its token cost.
    const um = data?.usageMetadata;
    const usage: Usage = {
      prompt: um?.promptTokenCount ?? 0,
      completion: um?.candidatesTokenCount ?? 0,
      total: um?.totalTokenCount ?? 0,
    };
    return NextResponse.json({ reply: text, plan: planMode, usage });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Gemini API. Check your connection and key." },
      { status: 200 }
    );
  }
}
