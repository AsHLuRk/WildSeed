import type { Concept } from "./schemas";

/**
 * Per-platform text limits that drive the character counters.
 * ⚠ These values change over time — verify against each platform's current
 * ad specs before you rely on them. They live in ONE place so fixing a number
 * here fixes every counter and every preview.
 */
export type FieldLimit = { max: number; recommended?: number };

export const PLATFORMS = {
  instagram: {
    label: "Instagram post",
    fields: {
      caption: { max: 2200, recommended: 125 },
      hashtags: { max: 30 },
    },
  },
  linkedin: {
    label: "LinkedIn ad",
    fields: {
      introText: { max: 600, recommended: 150 },
      headline: { max: 200, recommended: 70 },
    },
  },
  google: {
    label: "Google search ad",
    fields: {
      headline: { max: 30 },
      description: { max: 90 },
    },
  },
} as const satisfies Record<string, { label: string; fields: Record<string, FieldLimit> }>;

export type PlatformKey = keyof typeof PLATFORMS;

export type CharStatus = "ok" | "warn" | "over";

/** ok → within recommended; warn → past recommended (or within 10% of max); over → past max. */
export function charStatus(length: number, limit: FieldLimit): CharStatus {
  if (length > limit.max) return "over";
  if (limit.recommended !== undefined && length > limit.recommended) return "warn";
  if (length > limit.max * 0.9) return "warn";
  return "ok";
}

/** Truncate at a word boundary, adding an ellipsis only when something was cut (and it still fits). */
export function truncateAtWord(input: string, max: number): string {
  const s = input.trim();
  if (s.length <= max) return s;
  if (max <= 1) return s.slice(0, Math.max(0, max));
  const hard = s.slice(0, max - 1);
  const lastSpace = hard.lastIndexOf(" ");
  const cut = lastSpace > max * 0.5 ? hard.slice(0, lastSpace) : hard;
  return cut.replace(/[\s,;:.\-–—]+$/, "") + "…";
}

export type PlatformCopy = {
  instagram: { caption: string; hashtags: string[] };
  linkedin: { introText: string; headline: string; cta: string };
  google: { headline: string; description: string; cta: string };
};

/** Map one concept to what each platform preview should render (already limit-safe where hard limits are tight). */
export function toPlatformCopy(c: Concept): PlatformCopy {
  const tags = c.hashtags.slice(0, PLATFORMS.instagram.fields.hashtags.max);
  return {
    instagram: {
      caption: `${c.headline}\n\n${c.body}`,
      hashtags: tags,
    },
    linkedin: {
      introText: c.body,
      headline: c.headline,
      cta: c.cta,
    },
    google: {
      headline: truncateAtWord(c.headline, PLATFORMS.google.fields.headline.max),
      description: truncateAtWord(c.body, PLATFORMS.google.fields.description.max),
      cta: c.cta,
    },
  };
}
