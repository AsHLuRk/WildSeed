import { randomBytes } from "node:crypto";
import type { SharePayload } from "./schemas";

export const GENERATED_IMAGE_BUCKET = "wildseed-generated-images";

export function generatedImageUrl(id: string): string {
  return `/api/generated-images/${id}`;
}

/**
 * Minimal Supabase access over PostgREST — no SDK dependency.
 * SERVER-SIDE ONLY: uses the service-role key, which must never reach the browser.
 *   SUPABASE_URL                e.g. https://abcdxyz.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   the secret/service key
 */
export type SupabaseConfig = { url: string; key: string };

export function getSupabaseConfig(env: NodeJS.ProcessEnv = process.env): SupabaseConfig | null {
  const url = env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{8,32}$/;

export function generateShareId(): string {
  return randomBytes(9).toString("base64url"); // 12 URL-safe chars
}

/**
 * New-format keys (sb_secret_...) are opaque, not JWTs: Supabase wants them in the `apikey` header only.
 * Legacy service_role keys are JWTs and are conventionally sent in both headers.
 */
const authHeaders = (cfg: SupabaseConfig): Record<string, string> => {
  const h: Record<string, string> = { apikey: cfg.key };
  if (!cfg.key.startsWith("sb_")) h.Authorization = `Bearer ${cfg.key}`;
  return h;
};

const headers = (cfg: SupabaseConfig): Record<string, string> => ({
  ...authHeaders(cfg),
  "Content-Type": "application/json",
});

/** Supabase's own error text (e.g. PGRST205 "table not found"), trimmed, for server logs only. */
async function describeFailure(res: Response): Promise<string> {
  const body = await res.text().catch(() => "");
  return `${res.status}${body ? ` ${body.replace(/\s+/g, " ").slice(0, 300)}` : ""}`;
}

export async function insertShare(cfg: SupabaseConfig, id: string, payload: SharePayload): Promise<void> {
  const res = await fetch(`${cfg.url}/rest/v1/shares`, {
    method: "POST",
    headers: { ...headers(cfg), Prefer: "return=minimal" },
    body: JSON.stringify({ id, payload }),
  });
  if (!res.ok) throw new Error(`supabase insert failed: ${await describeFailure(res)}`);
}

export async function fetchShare(cfg: SupabaseConfig, id: string): Promise<SharePayload | null> {
  const res = await fetch(
    `${cfg.url}/rest/v1/shares?id=eq.${encodeURIComponent(id)}&select=payload&limit=1`,
    { headers: headers(cfg) },
  );
  if (!res.ok) throw new Error(`supabase fetch failed: ${await describeFailure(res)}`);
  const rows = (await res.json()) as { payload: SharePayload }[];
  return rows[0]?.payload ?? null;
}

export async function uploadGeneratedImage(cfg: SupabaseConfig, id: string, image: Buffer): Promise<void> {
  const body = new ArrayBuffer(image.byteLength);
  new Uint8Array(body).set(image);
  const res = await fetch(`${cfg.url}/storage/v1/object/${GENERATED_IMAGE_BUCKET}/${id}.jpg`, {
    method: "POST",
    headers: {
      ...authHeaders(cfg),
      "Content-Type": "image/jpeg",
      "Cache-Control": "max-age=31536000",
      "x-upsert": "false",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase image upload failed: ${await describeFailure(res)}`);
}

export async function fetchGeneratedImage(cfg: SupabaseConfig, id: string): Promise<Response> {
  return fetch(`${cfg.url}/storage/v1/object/${GENERATED_IMAGE_BUCKET}/${id}.jpg`, {
    headers: authHeaders(cfg),
    cache: "no-store",
  });
}

export async function hasGeneratedImageBucket(cfg: SupabaseConfig): Promise<boolean> {
  const res = await fetch(`${cfg.url}/storage/v1/bucket/${GENERATED_IMAGE_BUCKET}`, {
    headers: authHeaders(cfg),
    cache: "no-store",
  });
  return res.ok;
}
