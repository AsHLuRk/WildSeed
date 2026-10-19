/** Lower-case letters and digits only: "Kiln & Co." becomes "kilnco". */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "brand";

export const handleOf = (productName: string) => slug(productName);

/** Fake but safe web address for previews (".example" is reserved, so it never points at a real site). */
export const siteOf = (productName: string) => `www.${slug(productName)}.example`;

export const initialOf = (productName: string) => (productName.trim()[0] ?? "?").toUpperCase();

/** "#shop, kiln  #Mugs" becomes ["shop", "kiln", "Mugs"]. Max 10 tags, 40 characters each, no duplicates. */
export function parseHashtags(text: string): string[] {
  const cleaned = text
    .split(/[\s,]+/)
    .map((t) => t.replace(/[#!?.,;:'"()[\]{}<>@]/g, "").slice(0, 40))
    .filter(Boolean);
  return [...new Set(cleaned)].slice(0, 10);
}

export const formatHashtags = (tags: string[]) => tags.map((t) => `#${t}`).join(" ");
