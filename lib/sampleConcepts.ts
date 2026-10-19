import type { Brief, Concept, Goal, Tone } from "./schemas";

/** The brief behind the "Load demo brief" button. */
export const DEMO_BRIEF: Brief = {
  productName: "Kiln & Co.",
  audience: "design-loving coffee drinkers",
  goal: "sales",
  tones: ["premium", "minimal"],
  brandColor: "#FF5A1F",
  description: "Handmade matte ceramic coffee mugs, small-batch, glazed in warm cream.",
};

const clip = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…");

const CTA: Record<Goal, string> = {
  awareness: "Discover more",
  traffic: "Visit the site",
  leads: "Get in touch",
  sales: "Shop now",
};

/** Keep sentence punctuation tidy when a product name already ends with punctuation. */
const stop = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

type Line = (p: string) => string;
const HEADLINES: Record<Tone, [Line, Line, Line]> = {
  bold: [(p) => `${stop(p)} No compromises.`, (p) => `The story behind ${p}`, (p) => `Make ${p} your next move`],
  playful: [(p) => `Say hello to ${p}`, (p) => `How ${p} got its spark`, (p) => `${p} is calling your name`],
  premium: [(p) => `${p}, made to be noticed`, (p) => `The craft behind ${p}`, (p) => `Choose ${stop(p)} Choose better.`],
  minimal: [(p) => `${p}. Simply better.`, (p) => `Why ${p} exists`, (p) => `Meet ${p}`],
};

// hashtags are capped at 40 chars by the schema, so keep the product-name tag well under that
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);

/**
 * Deterministic, brief-aware sample output. Used for demo mode and as the
 * automatic fallback whenever the AI path is unavailable — the UI must never break.
 */
export function getDemoConcepts(brief: Brief): Concept[] {
  const p = brief.productName;
  const lead = brief.tones[0];
  const [h1, h2, h3] = HEADLINES[lead];
  const cta = CTA[brief.goal];
  const detail = brief.description ? ` ${brief.description.replace(/\.$/, "")}.` : "";
  const baseTags = [slug(p), lead, brief.goal === "sales" ? "shopnow" : brief.goal].filter(Boolean);
  const visual = (shot: string) =>
    clip(`${shot}, soft side light, shallow depth of field, ${brief.brandColor} as the accent colour, no text`, 300);

  return [
    {
      id: "c1",
      headline: clip(h1(p), 60),
      body: clip(`Made for ${brief.audience}. ${p} brings quality you can feel from the very first use.${detail}`, 280),
      cta,
      hashtags: [...baseTags, "quality"],
      visualDirection: visual("Close-up hero shot of the product on a dark stone surface"),
    },
    {
      id: "c2",
      headline: clip(h2(p), 60),
      body: clip(`Every detail of ${p} starts with one idea: ${brief.audience} deserve better than ordinary.${detail}`, 280),
      cta,
      hashtags: [...baseTags, "behindthescenes"],
      visualDirection: visual("Hands shaping or holding the product, workshop details in soft focus"),
    },
    {
      id: "c3",
      headline: clip(h3(p), 60),
      body: clip(`Your routine deserves an upgrade. ${p} is here for ${brief.audience} who notice the details.${detail}`, 280),
      cta,
      hashtags: [...baseTags, "upgrade"],
      visualDirection: visual("Lifestyle scene with the product in everyday use, warm morning light"),
    },
  ];
}
