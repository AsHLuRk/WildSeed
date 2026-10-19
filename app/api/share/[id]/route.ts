import { connection } from "next/server";
import { fetchShare, getSupabaseConfig, SHARE_ID_PATTERN } from "@/lib/supabase";
import { json } from "@/lib/http";


export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  if (!SHARE_ID_PATTERN.test(id)) return json({ error: "invalid_id" }, 400);

  const cfg = getSupabaseConfig();
  if (!cfg) return json({ error: "share_not_configured" }, 501);

  try {
    const payload = await fetchShare(cfg, id);
    if (!payload) return json({ error: "not_found" }, 404);
    return json(payload, 200, { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
  } catch (err) {
    console.error("[share] fetch failed:", err instanceof Error ? err.message : "unknown");
    return json({ error: "share_failed" }, 502);
  }
}
