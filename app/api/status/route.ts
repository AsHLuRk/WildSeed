import { connection } from "next/server";
import { getLlmConfig } from "@/lib/llm";
import { getCloudflareImageConfig } from "@/lib/cloudflareImages";
import { getSupabaseConfig } from "@/lib/supabase";
import { rateLimitBackend } from "@/lib/rateLimit";
import { json } from "@/lib/http";
import type { StatusResponse } from "@/lib/schemas";


/** Lets the UI decide what to show (e.g. hide the "Generate with AI" toggle, hide Share). Never returns secrets. */
export async function GET() {
  await connection(); // opt into request-time rendering so env vars are read per request, not frozen at build
  const body: StatusResponse = {
    ai: {
      enabled: process.env.ENABLE_AI === "true",
      configured: getLlmConfig() !== null,
    },
    images: {
      enabled: process.env.ENABLE_IMAGE_GENERATION === "true",
      configured: getCloudflareImageConfig() !== null && getSupabaseConfig() !== null,
    },
    share: { enabled: getSupabaseConfig() !== null },
    rateLimit: { backend: rateLimitBackend() },
  };
  return json(body);
}
