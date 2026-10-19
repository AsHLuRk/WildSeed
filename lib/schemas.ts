import { z } from "zod";

/**
 * Single source of truth for every shape that crosses the API boundary.
 * The UI should import types from "@/lib/types" (re-exports of these).
 */

export const TONES = ["bold", "playful", "premium", "minimal"] as const;
export const GOALS = ["awareness", "traffic", "leads", "sales"] as const;

const clean = (s: string) =>
  s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();

/** Bounded, whitespace-normalised, control-char-free text. */
const text = (min: number, max: number) =>
  z
    .string()
    .max(max * 4) // cheap raw-size guard before transforming
    .transform(clean)
    .pipe(z.string().min(min).max(max));

const hashtag = z
  .string()
  .max(160)
  .transform((s) => clean(s).replace(/^#+/, "").replace(/\s+/g, ""))
  .pipe(z.string().min(1).max(40));

export const briefSchema = z.object({
  productName: text(1, 80),
  audience: text(1, 160),
  goal: z.enum(GOALS),
  tones: z
    .array(z.enum(TONES))
    .min(1)
    .max(4)
    .transform((a) => [...new Set(a)]),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "brandColor must be a 6-digit hex like #FF5A1F")
    .default("#FF5A1F"),
  description: text(0, 400).optional(),
});

export const conceptSchema = z.object({
  id: text(1, 40),
  headline: text(1, 120),
  body: text(1, 600),
  cta: text(1, 40),
  hashtags: z.array(hashtag).max(10),
  visualDirection: text(1, 300),
  /** Which of the four product photos the Studio shows with this concept. */
  image: z.number().int().min(0).max(3).optional(),
  /** Stable, same-origin path to an AI-generated image stored by the server. */
  imageUrl: z.string().regex(/^\/api\/generated-images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).optional(),
});

/** What we require from the model: exactly three concepts, ids assigned by us. */
export const modelConceptsSchema = z.array(conceptSchema.omit({ id: true, imageUrl: true })).length(3);

export const generateRequestSchema = z.object({
  brief: briefSchema,
  mode: z.enum(["demo", "ai"]).default("demo"),
});

export const generateImageRequestSchema = z.object({
  brief: briefSchema,
  concept: conceptSchema,
});

export const shareSchema = z.object({
  brief: briefSchema,
  concepts: z.array(conceptSchema).min(1).max(6),
  selectedId: text(1, 40).optional(),
});

export type Tone = (typeof TONES)[number];
export type Goal = (typeof GOALS)[number];
/** Parsed/validated brief (brandColor always present). */
export type Brief = z.output<typeof briefSchema>;
/** What a form can send (brandColor optional). */
export type BriefInput = z.input<typeof briefSchema>;
export type Concept = z.output<typeof conceptSchema>;
export type SharePayload = z.output<typeof shareSchema>;

export type GenerateSource = "ai" | "demo" | "demo-fallback";
export type GenerateWarning =
  | "ai_disabled"
  | "ai_not_configured"
  | "rate_limited"
  | "daily_cap_reached"
  | "ai_failed";

export type GenerateResponse = {
  source: GenerateSource;
  concepts: Concept[];
  warning?: GenerateWarning;
  retryAfterSeconds?: number;
};

export type StatusResponse = {
  ai: { enabled: boolean; configured: boolean };
  images: { enabled: boolean; configured: boolean };
  share: { enabled: boolean };
  rateLimit: { backend: "upstash" | "memory" };
};

export function formatIssues(error: z.ZodError) {
  return error.issues.slice(0, 10).map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}
