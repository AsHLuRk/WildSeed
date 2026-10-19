import type { Brief, Concept } from "./schemas";
import { buildProductImagePrompt } from "./imagePrompt";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const IMAGE_TIMEOUT_MS = 60_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type CloudflareImageConfig = { accountId: string; token: string };

// Cloudflare tokens are passed as Bearer credentials. Reject copied prefixes,
// quotes, whitespace, and control characters before constructing the header.
const BEARER_TOKEN_PATTERN = /^[A-Za-z0-9._~+\/-]+=*$/;

export function getCloudflareImageConfig(env: NodeJS.ProcessEnv = process.env): CloudflareImageConfig | null {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !token || !BEARER_TOKEN_PATTERN.test(token)) return null;
  return { accountId, token };
}

export class ImageProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ImageProviderError";
  }
}

/** Keep diagnostics useful without ever including request headers or credential values. */
function safeFailureLabel(error: unknown, config: CloudflareImageConfig): string {
  if (!(error instanceof Error)) return "unknown error";
  const redact = (value: string) => value
    .replaceAll(config.token, "[redacted]")
    .replaceAll(config.accountId, "[account]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 180);
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: unknown }).code;
    const causeLabel = typeof code === "string" && /^[a-z0-9_-]{1,32}$/i.test(code) ? code : cause.name;
    return `${error.name}, cause ${causeLabel}: ${redact(cause.message)}`;
  }
  return `${error.name}: ${redact(error.message)}`;
}

/** Requests a JPEG from Cloudflare and validates its size before it reaches storage. */
export async function generateProductImage(
  config: CloudflareImageConfig,
  brief: Brief,
  concept: Concept,
): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: buildProductImagePrompt(brief, concept), steps: 4 }),
        signal: controller.signal,
        cache: "no-store",
      },
    );
    if (!response.ok) throw new ImageProviderError(`Cloudflare returned status ${response.status}`, response.status);

    const data = (await response.json()) as {
      result?: { image?: unknown };
      image?: unknown;
      success?: boolean;
    };
    const base64 = typeof data.result?.image === "string" ? data.result.image : data.image;
    if (typeof base64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
      throw new ImageProviderError("Cloudflare returned an invalid image payload");
    }

    const bytes = Buffer.from(base64, "base64");
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      throw new ImageProviderError("Cloudflare image exceeded the allowed size");
    }
    return bytes;
  } catch (error) {
    if (error instanceof ImageProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ImageProviderError("Cloudflare image generation timed out");
    }
    throw new ImageProviderError(`Cloudflare image generation request failed (${safeFailureLabel(error, config)})`);
  } finally {
    clearTimeout(timer);
  }
}
