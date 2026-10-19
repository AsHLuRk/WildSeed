import { getLlmConfig } from "@/lib/llm";
import { generateWithAi } from "@/lib/generate";
import { getDemoConcepts } from "@/lib/sampleConcepts";
import { checkRateLimit } from "@/lib/rateLimit";
import { num } from "@/lib/env";
import { getClientIp, json, isAllowedOrigin, readJsonBody } from "@/lib/http";
import {
  generateRequestSchema,
  formatIssues,
  type Brief,
  type GenerateResponse,
  type GenerateWarning,
} from "@/lib/schemas";

export const maxDuration = 45; // two LLM attempts at the default 15s timeout; adjust to your Vercel plan

function fallback(brief: Brief, warning: GenerateWarning, extra: Partial<GenerateResponse> = {}, headers: Record<string, string> = {}) {
  const body: GenerateResponse = { source: "demo-fallback", concepts: getDemoConcepts(brief), warning, ...extra };
  return json(body, 200, headers);
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: "forbidden_origin" }, 403);

  const body = await readJsonBody(req, 8 * 1024);
  if (!body.ok) return json({ error: body.error }, body.status);

  const parsed = generateRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return json({ error: "invalid_request", issues: formatIssues(parsed.error) }, 400);
  }
  const { brief, mode } = parsed.data;

  // Demo mode: instant, free, never fails.
  if (mode === "demo") {
    const res: GenerateResponse = { source: "demo", concepts: getDemoConcepts(brief) };
    return json(res);
  }

  // From here on the caller asked for real AI. Anything that stops us -> demo-fallback, never an error page.
  const env = process.env;
  if (env.ENABLE_AI !== "true") return fallback(brief, "ai_disabled");

  const cfg = getLlmConfig(env);
  if (!cfg) return fallback(brief, "ai_not_configured");

  const ip = getClientIp(req);
  const perIp = await checkRateLimit(`gen:ip:${ip}`, {
    limit: num(env.AI_RATE_LIMIT, 5),
    windowSeconds: 3600,
  });
  if (!perIp.allowed) {
    return fallback(brief, "rate_limited", { retryAfterSeconds: perIp.resetSeconds }, {
      "Retry-After": String(perIp.resetSeconds),
    });
  }

  const day = new Date().toISOString().slice(0, 10);
  const daily = await checkRateLimit(`gen:day:${day}`, {
    limit: num(env.AI_DAILY_CAP, 200),
    windowSeconds: 86400,
  });
  if (!daily.allowed) return fallback(brief, "daily_cap_reached");

  try {
    const concepts = await generateWithAi(cfg, brief);
    const res: GenerateResponse = { source: "ai", concepts };
    return json(res);
  } catch (err) {
    // Log the kind only — never the prompt, reply or key.
    console.error("[generate] AI path failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown");
    return fallback(brief, "ai_failed");
  }
}
