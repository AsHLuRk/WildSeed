/**
 * Pure helpers for the scroll-scrubbed frame sequence.
 * No DOM access here, so everything is unit-testable (tests/landing.test.ts).
 */

export type FrameSource = { dir: string; count: number };

export type Manifest = {
  version: 1;
  ext: "webp" | "jpg";
  desktop: FrameSource[];
  mobile: FrameSource[];
  /** Share of the whole sequence that plays by itself on load (0.05 to 0.6). */
  introEndFrac: number;
};

export const MOBILE_BREAKPOINT = 768;

/** On portrait screens a full "cover" crop would cut the flower off, so the frame is scaled to this share of cover. */
export const PORTRAIT_SCALE = 0.62;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const isSource = (s: unknown): s is FrameSource => {
  if (typeof s !== "object" || s === null) return false;
  const o = s as Record<string, unknown>;
  return typeof o.dir === "string" && Number.isInteger(o.count) && (o.count as number) > 0;
};

/** Validates /frames/manifest.json. Returns null when it can't be used. */
export function parseManifest(x: unknown): Manifest | null {
  if (!x || typeof x !== "object") return null;
  const m = x as Record<string, unknown>;
  const ext = m.ext === "jpg" ? "jpg" : m.ext === "webp" ? "webp" : null;
  if (!ext) return null;
  const desktop = Array.isArray(m.desktop) ? m.desktop.filter(isSource) : [];
  const mobile = Array.isArray(m.mobile) ? m.mobile.filter(isSource) : [];
  if (desktop.length === 0) return null;
  const frac = typeof m.introEndFrac === "number" && Number.isFinite(m.introEndFrac) ? m.introEndFrac : 0.25;
  return { version: 1, ext, desktop, mobile, introEndFrac: clamp(frac, 0.05, 0.6) };
}

export const pad4 = (n: number) => String(n).padStart(4, "0");

/** One global, ordered list of frame URLs: clip A then clip B (files are f_0001, f_0002, ...). */
export function frameUrls(sources: FrameSource[], ext: string): string[] {
  return sources.flatMap(({ dir, count }) =>
    Array.from({ length: count }, (_, i) => `${dir.replace(/\/+$/, "")}/f_${pad4(i + 1)}.${ext}`),
  );
}

/** Frame index where the automatic load intro stops and scrolling takes over. */
export function introEndFrame(total: number, frac: number): number {
  if (total <= 2) return 0;
  return clamp(Math.round(frac * (total - 1)), 1, total - 2);
}

/** Scroll progress (0..1, measured after the intro) to a (fractional) frame index. */
export function frameForProgress(p: number, total: number, introEnd: number): number {
  return introEnd + clamp(p, 0, 1) * (total - 1 - introEnd);
}

/**
 * For a fractional frame position, the two frames to show and how much of the second (0..1).
 * Cross-fading neighbours makes motion look continuous even with few frames.
 */
export function blendFrames(frame: number, total: number): { a: number; b: number; t: number } {
  const f = clamp(frame, 0, Math.max(0, total - 1));
  const a = Math.floor(f);
  return { a, b: Math.max(0, Math.min(a + 1, total - 1)), t: f - a };
}

/** Closest already-loaded frame to the target (prefers the earlier one on a tie), or -1 if none loaded. */
export function nearestLoadedIndex(target: number, isLoaded: (i: number) => boolean, total: number): number {
  if (total <= 0) return -1;
  const t = clamp(Math.round(target), 0, total - 1);
  if (isLoaded(t)) return t;
  for (let d = 1; d < total; d++) {
    const lo = t - d;
    const hi = t + d;
    if (lo >= 0 && isLoaded(lo)) return lo;
    if (hi < total && isLoaded(hi)) return hi;
  }
  return -1;
}

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Where to draw an iw x ih image on a cw x ch canvas, centred.
 * Landscape screens: "cover" (fills the canvas). Portrait screens: a smaller scale
 * (PORTRAIT_SCALE of cover) so the subject isn't cropped; the rest shows the page background.
 */
export function drawRect(iw: number, ih: number, cw: number, ch: number): Rect {
  const cover = Math.max(cw / iw, ch / ih);
  const scale = cw / ch < 1 ? Math.max(cw / iw, cover * PORTRAIT_SCALE) : cover;
  const w = iw * scale;
  const h = ih * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}
