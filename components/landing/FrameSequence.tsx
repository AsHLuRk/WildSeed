"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MotionValue } from "framer-motion";
import {
  MOBILE_BREAKPOINT,
  blendFrames,
  drawRect,
  frameForProgress,
  frameUrls,
  introEndFrame,
  nearestLoadedIndex,
  parseManifest,
} from "@/lib/landing/sequence";
import { getLenis, lockScroll } from "./lenis";

export type Phase = "loading" | "intro" | "ready" | "static";

type Props = {
  /** Updated with the post-intro scroll progress (0..1). Overlays read it without re-rendering React. */
  progress: MotionValue<number>;
  onPhaseChange: (phase: Phase) => void;
  onLoadProgress: (percent: number) => void;
  /** Rendered inside the pinned stage, above the canvas. */
  children?: ReactNode;
};

const HEAD_FRAMES = 13; // must be loaded before the intro starts
const CONCURRENCY = 4; // parallel image loads for the rest
const INTRO_SECONDS = 3;

export default function FrameSequence({ progress, onPhaseChange, onLoadProgress, children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let cancelled = false;
    const teardown: Array<() => void> = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const giveUp = () => {
      setMissing(true);
      onPhaseChange("static");
      lockScroll(false);
    };

    async function init() {
      if (!reduceMotion) lockScroll(true);

      let manifest = null;
      try {
        const res = await fetch("/frames/manifest.json");
        if (res.ok) manifest = parseManifest(await res.json());
      } catch {
        /* handled below */
      }
      if (cancelled) return;
      if (!manifest) return giveUp();

      const useMobile = window.innerWidth < MOBILE_BREAKPOINT && manifest.mobile.length > 0;
      const urls = frameUrls(useMobile ? manifest.mobile : manifest.desktop, manifest.ext);
      const total = urls.length;
      const introEnd = introEndFrame(total, manifest.introEndFrac);
      const images: (HTMLImageElement | undefined)[] = new Array(total).fill(undefined);
      const state = { frame: 0 };
      let lastKey = "";

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return giveUp();
      const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#F7F3EC";

      const isLoaded = (i: number) => images[i] !== undefined;
      const draw = () => {
        const { a, b, t } = blendFrames(state.frame, total);
        const ia = nearestLoadedIndex(a, isLoaded, total);
        if (ia < 0) return;
        // Cross-fade into the next frame when both are loaded. This is what makes slow scrolling look
        // continuous instead of stepping from picture to picture.
        const blend = isLoaded(a) && b !== a && t > 0.02 && isLoaded(b);
        const alpha = blend ? Math.round(t * 32) / 32 : 0; // quantised so tiny changes don't redraw
        const key = `${ia}|${blend ? b : ia}|${alpha}`;
        if (key === lastKey) return;

        const img = images[ia]!;
        const r = drawRect(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height);
        if (r.w < canvas.width || r.h < canvas.height) {
          ctx.fillStyle = paper; // portrait screens: fill around the frame with the page colour
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(img, r.x, r.y, r.w, r.h);
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          ctx.drawImage(images[b]!, r.x, r.y, r.w, r.h);
          ctx.globalAlpha = 1;
        }
        lastKey = key;
      };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
        lastKey = "";
        draw();
      };

      // Pre-decoding means the first time a frame is drawn it doesn't stall the scroll.
      const loadFrame = (i: number) =>
        new Promise<void>((resolve) => {
          if (images[i]) return resolve();
          const img = new Image();
          img.decoding = "async";
          img.src = urls[i];
          img
            .decode()
            .then(() => {
              images[i] = img;
              if (!cancelled && (lastKey === "" || Math.abs(i - state.frame) <= 2)) draw();
            })
            .catch(() => undefined) // a missing frame just falls back to the nearest loaded one
            .finally(resolve);
        });

      // 1) The first frames, with a visible progress bar.
      const head = Math.min(HEAD_FRAMES, total);
      let done = 0;
      await Promise.all(
        Array.from({ length: head }, (_, i) =>
          loadFrame(i).then(() => {
            done += 1;
            onLoadProgress(Math.round((done / head) * 100));
          }),
        ),
      );
      if (cancelled) return;
      if (!images[0]) return giveUp();

      resize();
      const onResize = () => resize();
      window.addEventListener("resize", onResize);
      teardown.push(() => window.removeEventListener("resize", onResize));

      // 2) Reduced motion: one static frame (the finished bloom), no scrubbing, no scroll lock.
      if (reduceMotion) {
        await loadFrame(total - 1);
        if (cancelled) return;
        state.frame = total - 1;
        lastKey = "";
        draw();
        onPhaseChange("static");
        return;
      }

      // 3) Everything else loads in the background, in scroll order.
      let next = head;
      const worker = async () => {
        while (!cancelled && next < total) {
          const i = next++;
          await loadFrame(i);
        }
      };
      void Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      // 4) Load intro, then hand over to scroll.
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      getLenis()?.scrollTo(0, { immediate: true });
      lockScroll(true); // again, now that Lenis exists
      onPhaseChange("intro");

      let introDone = false;
      const st = ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (!introDone) return;
          progress.set(self.progress);
          // Lenis already smooths the scroll itself; adding a second smoothing layer here only adds delay.
          state.frame = frameForProgress(self.progress, total, introEnd);
          draw();
        },
      });
      void document.fonts?.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });

      const tl = gsap.timeline({
        onComplete: () => {
          introDone = true;
          progress.set(0);
          lockScroll(false);
          ScrollTrigger.refresh();
          onPhaseChange("ready");
        },
      });
      tl.to(state, { frame: introEnd, duration: INTRO_SECONDS, ease: "power1.inOut", onUpdate: draw });

      teardown.push(() => {
        tl.kill();
        st.kill();
        gsap.killTweensOf(state);
        lockScroll(false);
      });
    }

    void init();

    return () => {
      cancelled = true;
      teardown.forEach((fn) => fn());
    };
  }, [progress, onPhaseChange, onLoadProgress]);

  return (
    <div ref={wrapperRef} className={missing ? "relative h-svh" : "relative h-[800svh] motion-reduce:h-svh"}>
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-paper">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {missing && process.env.NODE_ENV !== "production" && (
          <div className="absolute inset-x-0 bottom-6 z-20 mx-auto w-fit max-w-[90vw] rounded-full border border-line bg-card px-4 py-2 text-center text-sm text-ink/70">
            Frames not found. Put your clips in <code>source/</code> and run <code>npm run frames</code>.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
