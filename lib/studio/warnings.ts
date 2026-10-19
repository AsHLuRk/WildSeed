import type { GenerateResponse } from "@/lib/types";

export type ResultWarning = GenerateResponse["warning"] | "offline";

export type Notice = { kind: "info"; text: string };

/** Friendly text for why the visitor is looking at sample ideas instead of AI output. Null when nothing needs saying. */
export function describeResult(
  source: GenerateResponse["source"],
  warning?: ResultWarning,
  retryAfterSeconds?: number,
): Notice | null {
  if (source !== "demo-fallback") return null;
  switch (warning) {
    case "ai_disabled":
    case "ai_not_configured":
      return { kind: "info", text: "AI isn’t switched on for this site yet, so these are sample ideas." };
    case "rate_limited": {
      const minutes = retryAfterSeconds ? Math.max(1, Math.ceil(retryAfterSeconds / 60)) : null;
      return {
        kind: "info",
        text: `You’ve reached the hourly limit for AI ideas, so these are sample ideas.${minutes ? ` Try AI again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` : ""}`,
      };
    }
    case "daily_cap_reached":
      return { kind: "info", text: "Today’s free AI quota is used up, so these are sample ideas. AI will be back tomorrow." };
    case "offline":
      return { kind: "info", text: "We couldn’t reach the server, so these are sample ideas written in your browser." };
    case "ai_failed":
    default:
      return { kind: "info", text: "The AI didn’t answer in time, so these are sample ideas. Try again in a moment." };
  }
}
