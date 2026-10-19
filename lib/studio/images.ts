/** The four Kiln & Co. product shots live in public/assets/ads/kiln-01.webp ... kiln-04.webp. */
export const IMAGE_COUNT = 4;

export const imageSrc = (index: number) => `/assets/ads/kiln-${String(index + 1).padStart(2, "0")}.webp`;

/** Concepts c1, c2, c3 start with different shots, so the board doesn't look repetitive. */
export function defaultImageIndex(conceptId: string): number {
  const n = Number(/(\d+)$/.exec(conceptId)?.[1] ?? 1);
  return (((n - 1) % IMAGE_COUNT) + IMAGE_COUNT) % IMAGE_COUNT;
}

export function resolveImageIndex(concept: { id: string; image?: number }): number {
  const { image } = concept;
  return image !== undefined && Number.isInteger(image) && image >= 0 && image < IMAGE_COUNT
    ? image
    : defaultImageIndex(concept.id);
}
