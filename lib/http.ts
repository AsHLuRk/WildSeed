export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Basic quota-burn / CSRF guard: if the browser sends an Origin header, it must
 * match this host (or be listed in ALLOWED_ORIGINS, comma-separated).
 * Requests with no Origin header (curl, server-to-server) are allowed — the rate
 * limiter is what protects against those.
 */
export function isAllowedOrigin(req: Request, env: NodeJS.ProcessEnv = process.env): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes(origin)) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return originHost === host;
}

export type BodyResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

/** Read + parse a JSON body with a hard size cap. */
export async function readJsonBody(req: Request, maxBytes: number): Promise<BodyResult> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, status: 400, error: "unreadable_body" };
  }
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }
}
