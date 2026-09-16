export interface Finding {
  file: string;
  line: number;
  kind: string;
  /** Masked preview — secret ka actual value kabhi expose nahi hota. */
  preview: string;
}

const PATTERNS: { kind: string; blocking: boolean; re: RegExp }[] = [
  { kind: "github-token", blocking: true, re: /ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/ },
  { kind: "aws-key", blocking: true, re: /AKIA[0-9A-Z]{16}/ },
  { kind: "google-api-key", blocking: true, re: /AIza[0-9A-Za-z_-]{35}/ },
  { kind: "slack-token", blocking: true, re: /xox[bap]-[A-Za-z0-9-]{10,}/ },
  { kind: "private-key", blocking: true, re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { kind: "openai-key", blocking: true, re: /sk-[A-Za-z0-9]{20,}/ },
  {
    kind: "generic-secret",
    blocking: false,
    re: /(api[_-]?key|secret|passwd|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-+=/.]{16,}['"]/i,
  },
];

/** Generated code me secrets dhoondo. Values mask karke report karo. */
export function scanSecrets(files: { path: string; content: string }[]): (Finding & { blocking: boolean })[] {
  const out: (Finding & { blocking: boolean })[] = [];
  for (const f of files) {
    const lines = f.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const p of PATTERNS) {
        const m = lines[i].match(p.re);
        if (m) {
          const v = m[0];
          out.push({
            file: f.path,
            line: i + 1,
            kind: p.kind,
            preview: v.slice(0, 4) + "…" + v.slice(-3),
            blocking: p.blocking,
          });
          break;
        }
      }
      if (out.length >= 50) break;
    }
    if (out.length >= 50) break;
  }
  return out;
}

const INJECTION: RegExp[] = [
  /ignore (all )?previous instructions/i,
  /reveal (your|the) (system )?prompt/i,
  /you are now /i,
  /\bDAN\b.{0,20}mode/i,
  /jailbreak/i,
  /override (your|safety|system)/i,
  /disregard (all )?(prior|previous)/i,
  /system prompt (batao|dikhao|print)/i,
];

/** User prompt me prompt-injection patterns dhoondo. Returns matched pattern sources. */
export function screenPrompt(text: string): string[] {
  return INJECTION.filter((re) => re.test(text)).map((re) => re.source);
}
