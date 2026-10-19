import { generateShareId, getSupabaseConfig, insertShare } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rateLimit";
import { num } from "@/lib/env";
import { getClientIp, json, isAllowedOrigin, readJsonBody } from "@/lib/http";
import { formatIssues, shareSchema } from "@/lib/schemas";


export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: "forbidden_origin" }, 403);

  const cfg = getSupabaseConfig();
  if (!cfg) return json({ error: "share_not_configured" }, 501);

  const body = await readJsonBody(req, 32 * 1024);
  if (!body.ok) return json({ error: body.error }, body.status);

  const parsed = shareSchema.safeParse(body.data);
  if (!parsed.success) {
    return json({ error: "invalid_request", issues: formatIssues(parsed.error) }, 400);
  }

  const limit = await checkRateLimit(`share:ip:${getClientIp(req)}`, {
    limit: num(process.env.SHARE_RATE_LIMIT, 20),
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    return json({ error: "rate_limited", retryAfterSeconds: limit.resetSeconds }, 429, {
      "Retry-After": String(limit.resetSeconds),
    });
  }

  const id = generateShareId();
  try {
    await insertShare(cfg, id, parsed.data);
  } catch (err) {
    console.error("[share] insert failed:", err instanceof Error ? err.message : "unknown");
    return json({ error: "share_failed" }, 502);
  }
  return json({ id, path: `/share/${id}` }, 201);
}
