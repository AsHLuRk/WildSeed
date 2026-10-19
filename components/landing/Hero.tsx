"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { Phase } from "./FrameSequence";

export default function Hero({ phase, progress }: { phase: Phase; progress: MotionValue<number> }) {
  const fade = useTransform(progress, [0, 0.03, 0.07], [1, 1, 0]);
  const cueOpacity = useTransform(progress, [0, 0.02], [1, 0]);
  const show = phase !== "loading";

  return (
    <>
      <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-x-0 top-[12svh] z-10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.25em] text-ink/70 uppercase">Growth marketing studio</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-ink md:text-7xl">We help brands grow.</h1>
          <p className="mx-auto mt-5 max-w-md text-base text-ink/75 md:text-lg">
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
