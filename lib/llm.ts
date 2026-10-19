import { num } from "./env";
import type { Prompt } from "./prompt";

export type LlmProvider = "gemini" | "openai-compatible";

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  /** Required for openai-compatible, e.g. https://api.deepseek.com  (endpoint = base + /chat/completions) */
  baseUrl?: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export class LlmError extends Error {
  constructor(
    public kind: "timeout" | "http" | "empty" | "config",
    message: string,
    public status?: number,
  ) {
    super(message); // never put the API key in here
    this.name = "LlmError";
  }
}

/**
 * Reads LLM_* env vars. Returns null if AI can't be used (no key, or
 * openai-compatible without a base URL).
 *
 *   LLM_PROVIDER   gemini | openai-compatible   (default gemini)
 *   LLM_API_KEY    (GEMINI_API_KEY also accepted)
 *   LLM_MODEL      model id — check your provider's docs for the current free model
 *   LLM_BASE_URL   openai-compatible only (DeepSeek, Kimi/Moonshot, OpenRouter, ...)
 */
export function getLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  const provider = (env.LLM_PROVIDER ?? "gemini") as LlmProvider;
  if (provider !== "gemini" && provider !== "openai-compatible") return null;

  const apiKey = env.LLM_API_KEY ?? env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (provider === "openai-compatible" && !env.LLM_BASE_URL) return null;

  return {
    provider,
    apiKey,
    model: env.LLM_MODEL ?? (provider === "gemini" ? "gemini-2.5-flash" : ""),
    baseUrl: env.LLM_BASE_URL?.replace(/\/+$/, ""),
    timeoutMs: num(env.LLM_TIMEOUT_MS, 15000),
    maxOutputTokens: num(env.LLM_MAX_TOKENS, 1200),
  };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new LlmError("http", `LLM request failed with status ${res.status}`, res.status);
    return (await res.json()) as unknown;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new LlmError("timeout", "LLM request timed out");
    throw new LlmError("http", "LLM request failed");
  } finally {
    clearTimeout(timer);
  }
}

/** Calls the configured model and returns its raw text reply. */
export async function callLlm(cfg: LlmConfig, prompt: Prompt): Promise<string> {
  if (!cfg.model) throw new LlmError("config", "LLM_MODEL is not set");

  if (cfg.provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`;
    const data = (await postJson(
      url,
      { "x-goog-api-key": cfg.apiKey },
      {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: cfg.maxOutputTokens,
          responseMimeType: "application/json",
        },
      },
      cfg.timeoutMs,
    )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new LlmError("empty", "LLM returned no text");
    return text;
  }

  // openai-compatible: DeepSeek, Moonshot/Kimi, OpenRouter, etc.
  const data = (await postJson(
    `${cfg.baseUrl}/chat/completions`,
    { Authorization: `Bearer ${cfg.apiKey}` },
    {
      model: cfg.model,
      temperature: 0.9,
      max_tokens: cfg.maxOutputTokens,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    },
    cfg.timeoutMs,
  )) as { choices?: { message?: { content?: string } }[] };

  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new LlmError("empty", "LLM returned no text");
  return text;
}

/** Pull JSON out of a model reply, tolerating code fences and stray prose. Throws SyntaxError if none. */
export function extractJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    /* fall through to bracket scan */
  }
  const open = s.search(/[[{]/);
  if (open === -1) throw new SyntaxError("no JSON found in model reply");
  const closer = s[open] === "[" ? "]" : "}";
  const close = s.lastIndexOf(closer);
  if (close <= open) throw new SyntaxError("unterminated JSON in model reply");
  return JSON.parse(s.slice(open, close + 1));
}

/** Models sometimes wrap the array: { "concepts": [...] }. Accept both. */
export function unwrapConcepts(parsed: unknown): unknown {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const inner = (parsed as Record<string, unknown>).concepts;
    if (Array.isArray(inner)) return inner;
  }
  return parsed;
}
