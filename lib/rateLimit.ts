export type RateResult = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  backend: "upstash" | "memory";
};

type Opts = { limit: number; windowSeconds: number };

// ---- in-memory fallback (best effort: each serverless instance has its own map) ----
const memory = new Map<string, { count: number; resetAt: number }>();

export function _resetMemoryLimiter() {
  memory.clear();
}

function memoryLimit(key: string, { limit, windowSeconds }: Opts): RateResult {
  const now = Date.now();
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
  }
  let entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
    memory.set(key, entry);
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    backend: "memory",
  };
}

// ---- Upstash Redis over REST (shared across serverless instances) ----
export function rateLimitBackend(env: NodeJS.ProcessEnv = process.env): "upstash" | "memory" {
  return env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? "upstash" : "memory";
}

async function upstashLimit(key: string, { limit, windowSeconds }: Opts, env: NodeJS.ProcessEnv): Promise<RateResult> {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL!.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["SET", key, 0, "EX", windowSeconds, "NX"],
      ["INCR", key],
      ["TTL", key],
    ]),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const out = (await res.json()) as { result?: unknown }[];
  const count = Number(out[1]?.result);
  const ttl = Number(out[2]?.result);
  if (!Number.isFinite(count)) throw new Error("upstash bad response");
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds,
    backend: "upstash",
  };
}

/**
 * Fixed-window limiter. Uses Upstash when UPSTASH_REDIS_REST_URL/TOKEN are set,
 * otherwise (or if Upstash errors) an in-memory counter — never "unlimited".
 */
export async function checkRateLimit(
  key: string,
  opts: Opts,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RateResult> {
  if (rateLimitBackend(env) === "upstash") {
    try {
      return await upstashLimit(key, opts, env);
    } catch (err) {
      console.error("[rateLimit] upstash failed, using memory:", err instanceof Error ? err.message : "unknown");
    }
  }
  return memoryLimit(key, opts);
}
