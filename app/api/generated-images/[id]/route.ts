import { connection } from "next/server";
import { fetchGeneratedImage, getSupabaseConfig } from "@/lib/supabase";
import { json } from "@/lib/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "invalid_image_id" }, 400);

  const config = getSupabaseConfig();
  if (!config) return json({ error: "image_storage_not_configured" }, 501);

  try {
    const image = await fetchGeneratedImage(config, id);
    if (image.status === 404) return json({ error: "image_not_found" }, 404);
    if (!image.ok || !image.body) {
      console.error("[image] storage read failed:", image.status);
      return json({ error: "image_unavailable" }, 502);
    }

    return new Response(image.body, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[image] storage read failed:", err instanceof Error ? err.message : "unknown");
    return json({ error: "image_unavailable" }, 502);
  }
}
