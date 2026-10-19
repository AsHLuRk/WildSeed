# Wildseed landing page

A scroll-driven seed-to-bloom landing page (Next.js App Router, TypeScript, Tailwind v4, GSAP, Lenis, Framer Motion).
Light theme only. Built for the two Flow clips (`v1.mp4`, `v2.mp4`) from the guide.

How it behaves:
1. **Load:** a small loader while the first 13 frames download.
2. **Intro:** the first ~25% of the animation plays by itself for 3 seconds while the headline fades in. Scrolling is locked.
3. **Scroll:** scrolling then scrubs through the rest of the frames. Four text beats and a final call to action appear at set points.
4. **Below the animation:** Services, Process, Results and a final call to action, then the footer.

## Install (PowerShell, from your project root)

1. Copy these from the zip into your project, next to `package.json`. Say yes to overwrite `app/layout.tsx`, `app/globals.css` and `app/page.tsx`:
   `app/`, `components/`, `lib/landing/`, `scripts/`, `tests/landing.test.ts`
2. Install the packages (zod is already there from the backend):
   ```powershell
   npm i gsap lenis framer-motion zod
   ```
3. Add this line to the `scripts` block in `package.json`:
   ```json
   "frames": "node scripts/make-frames.mjs"
   ```
4. Put your clips here (create the folder), named exactly:
   ```
   source/v1.mp4
   source/v2.mp4
   ```
   Add `source/` to `.gitignore`. Keep `public/frames/` in git, because the site needs it.
5. Install ffmpeg if you don't have it (`winget install Gyan.FFmpeg`), reopen the terminal, then:
   ```powershell
   npm run frames
   npm run dev
   ```
   `npm run frames` writes `public/frames/{a,b,a-m,b-m}/` and `public/frames/manifest.json`. The page reads the manifest, so you never edit frame counts by hand.

## Options for `npm run frames`

```powershell
npm run frames -- --fps 10 --quality 60 --desktop-width 1024
```
| Option | Default | Use it to |
|---|---|---|
| `--fps` | 12 | Fewer frames = smaller and lighter (10 is fine), more = smoother |
| `--quality` | 70 | Shrink the files (60 is usually fine) |
| `--desktop-width` / `--mobile-width` | 1280 / 720 | Reduce memory use on big sequences |
| `--intro` | 0.25 | Share of the animation that plays on load (0.05 to 0.6) |
| `--jpg` | off | Use JPG if your ffmpeg has no WebP encoder |
| `--clips a.mp4,b.mp4` | source/v1.mp4,source/v2.mp4 | Use different file names |

The script prints file sizes and a worst-case memory estimate. If the estimate is above ~600 MB on desktop, lower `--desktop-width` or `--fps`.

## Where to tune things

| What | Where |
|---|---|
| When each text beat appears, its words, left or right side | `lib/landing/beats.ts` (windows are 0 to 1 of the scroll *after* the intro) |
| Intro length | `INTRO_SECONDS` in `components/landing/FrameSequence.tsx` |
| How long the scroll feels | `h-[800svh]` in `FrameSequence.tsx` (bigger = slower scrubbing) |
| How much of the frame shows on phones | `PORTRAIT_SCALE` in `lib/landing/sequence.ts` (lower shows more of the frame) |
| Colours | `:root` in `app/globals.css`. If your frames' background is slightly different from `--paper`, sample the colour from a frame and put it in `--paper` |
| Fonts | `app/layout.tsx` (Fraunces for headings, DM Sans for text) |
| How smooth or snappy the scroll feels | `lerp` in `components/landing/SmoothScroll.tsx` (0.10 = floaty, 0.16 = default, 0.22 = snappy) |
| Page copy and fictional stats | `components/landing/Sections.tsx` |

## What the page does in special cases

- **Reduced motion:** the story becomes one screen showing the finished bloom as a still image, with no scroll lock and no scrubbing. The text beats are not shown in this mode; the Services section carries the same message.
- **Frames missing or broken:** no loader, no scroll lock, the headline and all sections still work. In development a small note tells you to run `npm run frames`.
- **Phones:** use the `-m` frame set automatically, and the frame is scaled down so the flower isn't cropped; the area around it is filled with the page colour.
- **`/studio`:** the ad studio, with a product brief, generated ideas, editable platform previews, and optional share links.
  Product photos are optional; until `public/assets/ads/kiln-01..04.webp` are added, previews use a brand-coloured fallback.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Frames not found" note | Run `npm run frames` and make sure `public/frames/manifest.json` exists |
| Text covers the flower | Switch that beat's `side` in `beats.ts`, or narrow its window |
| Visible jump between the two clips | Clip 2 must start on clip 1's last frame (see the guide's seam tip) |
| Visible edge where the story ends | Set `--paper` to the colour of your frames' background |
| Scroll feels steppy | Neighbouring frames are cross-faded automatically, so this should be rare. If it still looks like a slideshow, use more frames: `npm run frames -- --fps 18` |
| Scroll feels floaty or delayed | Raise `lerp` in `SmoothScroll.tsx` (try 0.2). Also test with `npm run build` then `npm run start`; `npm run dev` is noticeably slower |
| Choppy on a laptop | Use `--fps 10 --desktop-width 1024` and run `npm run frames` again |
| ffmpeg not found | Install it, then **reopen** the terminal |
| Stale frames after re-running | Hard refresh (Ctrl+Shift+R); the browser caches images |

## What was tested, and what wasn't

Tested, with synthetic stand-in clips (a growing plant with frame numbers drawn on it), in headless Chromium against the production build: scroll locked during the intro and unlocked after; the plant resumes exactly where the intro stopped; the animation advances monotonically with scroll; every text beat shows in its window; the finale button is clickable; desktop loads only the desktop frames and phones only the mobile frames; reduced motion; missing frames; no console errors; no horizontal scroll. 44 unit and route tests pass, plus type-check and lint. Scroll smoothness was measured on the old and new code: the picture now changes on every screen update (it used to change on about 28% of them) and settles about 300 ms sooner after you stop scrolling.

**Not tested:** your real clips (I never saw them), the Google fonts (my sandbox can't download them, so the build was checked with a font-less copy of the layout), Safari and real phones, and performance on your hardware. Check those yourself, and tune the text beats against your real footage.
