import { describe, expect, it } from "vitest";
import {
  PORTRAIT_SCALE,
  blendFrames,
  drawRect,
  frameForProgress,
  frameUrls,
  introEndFrame,
  nearestLoadedIndex,
  pad4,
  parseManifest,
} from "@/lib/landing/sequence";
import { BEATS, FINALE } from "@/lib/landing/beats";

describe("parseManifest", () => {
  const good = {
    version: 1,
    ext: "webp",
    desktop: [{ dir: "/frames/a", count: 96 }, { dir: "/frames/b", count: 96 }],
    mobile: [{ dir: "/frames/a-m", count: 96 }, { dir: "/frames/b-m", count: 96 }],
    introEndFrac: 0.25,
  };

  it("accepts a valid manifest", () => {
    const m = parseManifest(good)!;
    expect(m.ext).toBe("webp");
    expect(m.desktop).toHaveLength(2);
    expect(m.introEndFrac).toBe(0.25);
  });

  it("rejects junk, missing desktop frames and unknown extensions", () => {
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest("nope")).toBeNull();
    expect(parseManifest({ ...good, desktop: [] })).toBeNull();
    expect(parseManifest({ ...good, ext: "png" })).toBeNull();
    expect(parseManifest({ ...good, desktop: [{ dir: "/x", count: 0 }, { dir: 5, count: 3 }] })).toBeNull();
  });

  it("drops invalid sources, tolerates missing mobile, clamps introEndFrac, defaults it", () => {
    const m = parseManifest({ ...good, mobile: undefined, introEndFrac: 5, desktop: [...good.desktop, { dir: 1 }] })!;
    expect(m.mobile).toEqual([]);
    expect(m.desktop).toHaveLength(2);
    expect(m.introEndFrac).toBe(0.6);
    expect(parseManifest({ ...good, introEndFrac: "x" })!.introEndFrac).toBe(0.25);
    expect(parseManifest({ ...good, introEndFrac: -1 })!.introEndFrac).toBe(0.05);
  });
});

describe("frameUrls", () => {
  it("builds one ordered list across clips with zero-padded names", () => {
    const urls = frameUrls([{ dir: "/frames/a/", count: 2 }, { dir: "/frames/b", count: 3 }], "webp");
    expect(urls).toEqual([
      "/frames/a/f_0001.webp",
      "/frames/a/f_0002.webp",
      "/frames/b/f_0001.webp",
      "/frames/b/f_0002.webp",
      "/frames/b/f_0003.webp",
    ]);
    expect(pad4(123)).toBe("0123");
    expect(frameUrls([], "jpg")).toEqual([]);
  });
});

describe("introEndFrame / frameForProgress", () => {
  it("keeps the intro end strictly inside the sequence", () => {
    expect(introEndFrame(192, 0.25)).toBe(48);
    expect(introEndFrame(10, 0.6)).toBe(5);
    expect(introEndFrame(10, 0.05)).toBe(1);
    expect(introEndFrame(3, 0.6)).toBe(1);
    expect(introEndFrame(2, 0.25)).toBe(0);
    expect(introEndFrame(1, 0.25)).toBe(0);
  });

  it("maps scroll progress from the intro end to the last frame, clamped", () => {
    const total = 192;
    const end = 48;
    expect(frameForProgress(0, total, end)).toBe(48);
    expect(frameForProgress(1, total, end)).toBe(191);
    expect(frameForProgress(0.5, total, end)).toBeCloseTo(119.5);
    expect(frameForProgress(-3, total, end)).toBe(48);
    expect(frameForProgress(9, total, end)).toBe(191);
  });
});

describe("blendFrames", () => {
  it("splits a fractional frame into two neighbours and a blend amount", () => {
    const r = blendFrames(10.25, 20);
    expect(r.a).toBe(10);
    expect(r.b).toBe(11);
    expect(r.t).toBeCloseTo(0.25);
    expect(blendFrames(7, 20)).toEqual({ a: 7, b: 8, t: 0 });
  });

  it("clamps at both ends so it never points outside the sequence", () => {
    expect(blendFrames(19, 20)).toEqual({ a: 19, b: 19, t: 0 });
    expect(blendFrames(25, 20)).toEqual({ a: 19, b: 19, t: 0 });
    expect(blendFrames(18.5, 20).b).toBe(19);
    expect(blendFrames(-3, 20)).toEqual({ a: 0, b: 1, t: 0 });
    expect(blendFrames(0.4, 1)).toEqual({ a: 0, b: 0, t: 0 });
    expect(blendFrames(0, 0)).toEqual({ a: 0, b: 0, t: 0 });
  });
});

describe("nearestLoadedIndex", () => {
  const loadedSet = (...ids: number[]) => (i: number) => ids.includes(i);

  it("returns the target when loaded, else the closest loaded frame", () => {
    expect(nearestLoadedIndex(5, loadedSet(5), 10)).toBe(5);
    expect(nearestLoadedIndex(7, loadedSet(0, 1, 2, 3), 10)).toBe(3);
    expect(nearestLoadedIndex(2, loadedSet(0, 9), 10)).toBe(0);
    expect(nearestLoadedIndex(8, loadedSet(0, 9), 10)).toBe(9);
  });

  it("prefers the earlier frame on a tie, clamps the target and handles nothing loaded", () => {
    expect(nearestLoadedIndex(5, loadedSet(4, 6), 10)).toBe(4);
    expect(nearestLoadedIndex(99, loadedSet(9), 10)).toBe(9);
    expect(nearestLoadedIndex(-4, loadedSet(0), 10)).toBe(0);
    expect(nearestLoadedIndex(3, () => false, 10)).toBe(-1);
    expect(nearestLoadedIndex(0, () => true, 0)).toBe(-1);
  });
});

describe("drawRect", () => {
  it("landscape: covers the whole canvas, centred", () => {
    const r = drawRect(1280, 720, 1920, 1080);
    expect(r.w).toBeCloseTo(1920);
    expect(r.h).toBeCloseTo(1080);
    expect(r.x).toBeCloseTo(0);
    const wide = drawRect(1280, 720, 2000, 800); // ultra-wide: width-limited cover
    expect(wide.w).toBeCloseTo(2000);
    expect(wide.h).toBeGreaterThanOrEqual(800);
    expect(wide.y).toBeLessThanOrEqual(0);
  });

  it("portrait: uses a smaller scale so the subject is not cropped, centred vertically", () => {
    const cw = 390;
    const ch = 844;
    const r = drawRect(720, 405, cw, ch);
    const cover = Math.max(cw / 720, ch / 405);
    expect(r.w / 720).toBeCloseTo(cover * PORTRAIT_SCALE);
    expect(r.h).toBeLessThan(ch); // letterboxed top and bottom (page background shows)
    expect(r.x).toBeLessThan(0); // still crops the sides, but far less than full cover
    expect(r.y).toBeGreaterThan(0);
    expect(r.x + r.w / 2).toBeCloseTo(cw / 2);
    expect(r.y + r.h / 2).toBeCloseTo(ch / 2);
  });

  it("portrait never scales below fit-to-width", () => {
    const r = drawRect(1280, 720, 400, 410); // nearly square, portrait
    expect(r.w).toBeGreaterThanOrEqual(400);
  });
});

describe("beats", () => {
  it("windows are valid, ordered and don't overlap, and the finale starts after them", () => {
    let prevEnd = 0;
    for (const b of BEATS) {
      expect(b.start).toBeGreaterThanOrEqual(prevEnd);
      expect(b.end).toBeGreaterThan(b.start + 0.08); // room for the fade in and out
      expect(b.end).toBeLessThanOrEqual(1);
      prevEnd = b.end;
    }
    expect(FINALE.start).toBeGreaterThanOrEqual(prevEnd);
    expect(FINALE.fadeEnd).toBeGreaterThan(FINALE.start);
    expect(FINALE.href).toBe("/studio");
  });
});
