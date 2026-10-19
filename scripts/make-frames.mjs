#!/usr/bin/env node
/**
 * Turns your two Flow clips into web-ready frame sequences plus a manifest the page reads.
 *
 *   npm run frames
 *
 * Needs ffmpeg on your PATH (Windows: `winget install Gyan.FFmpeg`, then reopen the terminal).
 * Reads   source/v1.mp4 and source/v2.mp4   (override with --clips a.mp4,b.mp4)
 * Writes  public/frames/{a,b,a-m,b-m}/f_0001.webp ...  and  public/frames/manifest.json
 *
 * Options: --fps 12  --quality 70  --jpg  --intro 0.25  --desktop-width 1280  --mobile-width 720
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "public/frames";

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const o = {
    clips: ["source/v1.mp4", "source/v2.mp4"],
    fps: 12,
    quality: 70,
    jpg: false,
    intro: 0.25,
    desktopWidth: 1280,
    mobileWidth: 720,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined) fail(`Missing value after ${a}`);
      return v;
    };
    const number = () => {
      const n = Number(value());
      if (!Number.isFinite(n) || n <= 0) fail(`${a} needs a positive number`);
      return n;
    };
    switch (a) {
      case "--clips": o.clips = value().split(",").map((s) => s.trim()); break;
      case "--fps": o.fps = number(); break;
      case "--quality": o.quality = number(); break;
      case "--intro": o.intro = number(); break;
      case "--desktop-width": o.desktopWidth = number(); break;
      case "--mobile-width": o.mobileWidth = number(); break;
      case "--jpg": o.jpg = true; break;
      default: fail(`Unknown option ${a}`);
    }
  }
  if (o.clips.length !== 2) fail("--clips needs exactly two files, e.g. --clips source/v1.mp4,source/v2.mp4");
  return o;
}

const o = parseArgs(process.argv.slice(2));
const ext = o.jpg ? "jpg" : "webp";

const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
if (probe.error || probe.status !== 0) {
  fail("ffmpeg was not found. Install it (Windows: `winget install Gyan.FFmpeg`), reopen the terminal and run this again.");
}
for (const clip of o.clips) {
  if (!existsSync(clip)) fail(`Clip not found: ${clip}\nPut your two MP4 files in the source/ folder as v1.mp4 and v2.mp4.`);
}

function extract(src, dir, width) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const codec = o.jpg
    ? ["-q:v", String(Math.max(2, Math.min(31, Math.round((100 - o.quality) / 6))))]
    : ["-c:v", "libwebp", "-quality", String(o.quality)];
  const args = [
    "-y", "-loglevel", "error", "-i", src,
    "-vf", `fps=${o.fps},scale=${width}:-2`,
    ...codec,
    path.join(dir, `f_%04d.${ext}`),
  ];
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) {
    const hint = !o.jpg && /libwebp|Unknown encoder|Encoder/i.test(r.stderr || "")
      ? "\nYour ffmpeg build has no WebP encoder. Run again with --jpg."
      : "";
    fail(`ffmpeg failed on ${src}:\n${(r.stderr || "").trim()}${hint}`);
  }
}

function inspect(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(`.${ext}`)).sort();
  const bytes = files.reduce((sum, f) => sum + statSync(path.join(dir, f)).size, 0);
  let size = null;
  if (files.length) {
    const p = spawnSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join(dir, files[0])],
      { encoding: "utf8" },
    );
    const [w, h] = (p.stdout || "").trim().split(",").map(Number);
    if (w && h) size = { w, h };
  }
  return { count: files.length, bytes, size };
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
const targets = [
  { key: "desktop", name: "a", clip: 0, width: o.desktopWidth },
  { key: "desktop", name: "b", clip: 1, width: o.desktopWidth },
  { key: "mobile", name: "a-m", clip: 0, width: o.mobileWidth },
  { key: "mobile", name: "b-m", clip: 1, width: o.mobileWidth },
];

const manifest = { version: 1, ext, desktop: [], mobile: [], introEndFrac: o.intro };
const totals = { desktop: { bytes: 0, frames: 0, pixels: 0 }, mobile: { bytes: 0, frames: 0, pixels: 0 } };

for (const t of targets) {
  const dir = path.join(OUT, t.name);
  process.stdout.write(`Extracting ${o.clips[t.clip]} -> ${dir} (${t.width}px wide) ... `);
  extract(o.clips[t.clip], dir, t.width);
  const info = inspect(dir);
  if (info.count === 0) fail(`No frames were written to ${dir}.`);
  console.log(`${info.count} frames, ${mb(info.bytes)} MB`);
  manifest[t.key].push({ dir: `/frames/${t.name}`, count: info.count });
  totals[t.key].bytes += info.bytes;
  totals[t.key].frames += info.count;
  if (info.size) totals[t.key].pixels += info.count * info.size.w * info.size.h;
}

// Desktop and mobile sets must line up frame for frame (same clips, same fps).
for (let i = 0; i < 2; i++) {
  if (manifest.desktop[i].count !== manifest.mobile[i].count) {
    console.warn(`Warning: clip ${i + 1} has ${manifest.desktop[i].count} desktop frames but ${manifest.mobile[i].count} mobile frames.`);
  }
}

writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`\nDone. Wrote ${path.join(OUT, "manifest.json")}`);
for (const key of ["desktop", "mobile"]) {
  const t = totals[key];
  const decoded = t.pixels ? ` | worst case if every frame stays decoded: ~${Math.round((t.pixels * 4) / 1024 / 1024)} MB of memory` : "";
  console.log(`  ${key}: ${t.frames} frames, ${mb(t.bytes)} MB on disk${decoded}`);
}
if (totals.desktop.bytes > 25 * 1024 * 1024) {
  console.warn("\nTip: the desktop set is large. Lower the size with --quality 60, --fps 10 or --desktop-width 1024.");
}
if (totals.desktop.pixels * 4 > 900 * 1024 * 1024) {
  console.warn("Tip: decoded frames use a lot of memory. Use --desktop-width 1024 or --fps 10.");
}
console.log(`\nIntro plays the first ${Math.round(o.intro * 100)}% of the animation automatically (change with --intro).`);
