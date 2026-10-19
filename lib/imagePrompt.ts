import type { Brief, Concept } from "./schemas";

const cue = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Keep product facts anchored to the user-authored brief. Concept direction is only a
 * composition cue because it may have been written by the copy model.
 */
export function buildProductImagePrompt(brief: Brief, concept: Concept): string {
  const limits = { productName: 80, description: 400, audience: 160, direction: 300 };
  const tone = brief.tones.join(", ");

  const build = () => {
    const productName = cue(brief.productName, limits.productName);
    const description = cue(brief.description ?? "", limits.description) || "No physical product description was provided.";
    const audience = cue(brief.audience, limits.audience);
    const direction = cue(concept.visualDirection, limits.direction);

    return [
      "Create one square, photorealistic editorial advertising photograph, not a poster or graphic design.",
      "Use the product description below as the only source of physical product facts. Show an unbranded, generic example only when its category is clear. Use only appearance details explicitly stated in that description. If the product or its appearance is unclear, make a relevant lifestyle still life and do not invent or depict a specific product.",
      "Do not invent materials, ingredients, colors, dimensions, packaging, functions, certifications, prices, or product claims. Do not add readable text, letters, numbers, logos, labels, brand marks, watermarks, or pseudo-text anywhere in the image. Do not imply medical, environmental, or performance claims.",
      `Product name for context only; never render it as text: ${JSON.stringify(productName)}.`,
      `User-provided product description; factual source: ${JSON.stringify(description)}.`,
      `Audience and tone for scene styling only: ${JSON.stringify(audience)}; ${tone}.`,
      `Use ${brief.brandColor} only as a restrained background or prop accent; do not create a logo or packaging in that color.`,
      `Composition cue only; it must not add product facts: ${JSON.stringify(direction)}.`,
      "Use natural materials and believable lighting only when consistent with the stated description. Keep the composition clean, premium, calm, and suitable for a social media ad. One image, one coherent scene, no collage.",
    ].join(" ");
  };

  let prompt = build();
  // Cloudflare caps prompts at 2048 chars. Trim style cues first and preserve product facts longest.
  const trimOrder = ["direction", "audience", "productName", "description"] as const;
  while (prompt.length > 2048) {
    const key = trimOrder.find((field) => limits[field] > 0);
    if (!key) break;
    limits[key] = Math.max(0, limits[key] - 20);
    prompt = build();
  }
  return prompt.slice(0, 2048);
}
