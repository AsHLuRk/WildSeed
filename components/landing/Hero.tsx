"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { Phase } from "./FrameSequence";

export default function Hero({ phase, progress }: { phase: Phase; progress: MotionValue<number> }) {
  const fade = useTransform(progress, [0, 0.03, 0.07], [1, 1, 0]);
  const cueOpacity = useTransform(progress, [0, 0.02], [1, 0]);
  const show = phase !== "loading";

  return (
    <>
      <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-x-0 top-[13svh] z-10 px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] tracking-[0.2em] text-ink/70 uppercase sm:text-xs sm:tracking-[0.25em]">Growth marketing studio</p>
          <h1 className="mx-auto mt-4 max-w-[12ch] font-display text-[clamp(2.75rem,13vw,3.75rem)] leading-[0.98] text-ink md:max-w-none md:text-7xl">We help brands grow.</h1>
          <p className="mx-auto mt-5 max-w-[30ch] text-[15px] leading-6 text-ink/75 md:max-w-md md:text-lg">
            Strategy, creative and media that compound, planted with care.
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ opacity: cueOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase === "ready" ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[11px] tracking-[0.25em] text-ink/60 uppercase">Scroll</span>
          <span className="h-8 w-px animate-pulse bg-ink/40" />
        </motion.div>
      </motion.div>
    </>
  );
}
