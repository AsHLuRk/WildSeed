import { randomUUID } from "node:crypto";
import { getCloudflareImageConfig, generateProductImage } from "@/lib/cloudflareImages";
import { getClientIp, isAllowedOrigin, json, readJsonBody } from "@/lib/http";
import { generateImageRequestSchema, formatIssues } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { num } from "@/lib/env";
import { generatedImageUrl, getSupabaseConfig, hasGeneratedImageBucket, uploadGeneratedImage } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: "forbidden_origin" }, 403);
  if (process.env.ENABLE_IMAGE_GENERATION !== "true") return json({ error: "image_generation_disabled" }, 503);

  const cloudflare = getCloudflareImageConfig();
  if (!cloudflare) return json({ error: "image_generation_not_configured" }, 501);

  const supabase = getSupabaseConfig();
  if (!supabase) return json({ error: "image_storage_not_configured" }, 501);

  const body = await readJsonBody(req, 12 * 1024);
  if (!body.ok) return json({ error: body.error }, body.status);

  const parsed = generateImageRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return json({ error: "invalid_request", issues: formatIssues(parsed.error) }, 400);
  }

  try {
    if (!(await hasGeneratedImageBucket(supabase))) return json({ error: "image_storage_not_ready" }, 503);
  } catch {
    return json({ error: "image_storage_not_ready" }, 503);
  }

  const ip = getClientIp(req);
  const perIp = await checkRateLimit(`image:ip:${ip}`, {
    limit: num(process.env.IMAGE_RATE_LIMIT, 3),
    windowSeconds: 3600,
  });
  if (!perIp.allowed) {
    return json({ error: "image_rate_limited", retryAfterSeconds: perIp.resetSeconds }, 429, {
      "Retry-After": String(perIp.resetSeconds),
    });
  }

  const day = new Date().toISOString().slice(0, 10);
  const daily = await checkRateLimit(`image:day:${day}`, {
    limit: num(process.env.IMAGE_DAILY_CAP, 20),
    windowSeconds: 86400,
  });
  if (!daily.allowed) return json({ error: "image_daily_cap_reached" }, 429);

  try {
    const image = await generateProductImage(cloudflare, parsed.data.brief, parsed.data.concept);
    const id = randomUUID();
    await uploadGeneratedImage(supabase, id, image);
    return json({ imageUrl: generatedImageUrl(id) }, 201);
  } catch (err) {
    console.error("[image] generation or storage failed:", err instanceof Error ? err.message : "unknown");
    return json({ error: "image_generation_failed" }, 502);
  }
}
