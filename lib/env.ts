/** Parse a numeric env var with a safe default (ignores NaN / non-positive values). */
export function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
