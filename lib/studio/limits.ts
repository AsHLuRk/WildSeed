import { PLATFORMS, charStatus, toPlatformCopy, type CharStatus } from "@/lib/platforms";
import type { Concept } from "@/lib/types";

export type CounterRow = {
  id: string;
  platform: string;
  length: number;
  /** The number to show next to the count: the recommended length if there is one, else the hard limit. */
  shown: number;
  max: number;
  recommended?: number;
  status: CharStatus;
};

const row = (id: string, platform: string, length: number, limit: { max: number; recommended?: number }): CounterRow => ({
  id,
  platform,
  length,
  shown: limit.recommended ?? limit.max,
  max: limit.max,
  recommended: limit.recommended,
  status: charStatus(length, limit),
});

export function headlineCounters(c: Pick<Concept, "headline">): CounterRow[] {
  const n = c.headline.length;
  return [
    row("google-headline", "Google", n, PLATFORMS.google.fields.headline),
    row("linkedin-headline", "LinkedIn", n, PLATFORMS.linkedin.fields.headline),
  ];
}

export function bodyCounters(c: Concept): CounterRow[] {
  const n = c.body.length;
  return [
    row("google-description", "Google", n, PLATFORMS.google.fields.description),
    row("linkedin-intro", "LinkedIn", n, PLATFORMS.linkedin.fields.introText),
    row("instagram-caption", "Instagram", toPlatformCopy(c).instagram.caption.length, PLATFORMS.instagram.fields.caption),
  ];
}

/** Human description of what a counter means, for tooltips. */
export function counterHint(r: CounterRow): string {
  return r.recommended
    ? `${r.platform}: aim for up to ${r.recommended} characters; the hard limit is ${r.max}.`
    : `${r.platform}: hard limit of ${r.max} characters.`;
}
