"use client";

import { motion } from "framer-motion";
import { EASE, VIEWPORT, useMotionAllowed } from "@/lib/landing/motion";

type Step = { title: string; when: string; body: string };

export default function MotionProcess({ steps }: { steps: Step[] }) {
  const allowed = useMotionAllowed();
  return (
    <div className="relative mt-20 grid gap-12 md:mt-32 md:grid-cols-3 md:gap-10">
      <div aria-hidden="true" className="absolute left-0 right-0 top-3 hidden h-px origin-left bg-leaf/50 md:block" />
      {steps.map((step, index) => (
        <motion.article key={step.title} initial={allowed ? { opacity: 0, y: 20 } : false} whileInView={allowed ? { opacity: 1, y: 0 } : undefined} viewport={VIEWPORT} transition={{ duration: 0.8, delay: index * 0.12, ease: EASE }} className="relative">
          <span className="relative z-10 block h-7 w-7 border border-leaf bg-card before:absolute before:left-1/2 before:top-1/2 before:h-2 before:w-2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:bg-leaf" aria-hidden="true" />
          <p className="mt-8 text-[11px] tracking-[0.22em] text-leaf uppercase">Step {index + 1} / {step.when}</p>
          <h3 className="mt-4 font-display text-4xl leading-none tracking-[-0.02em] text-ink">{step.title}</h3>
          <p className="mt-4 max-w-sm text-[17px] leading-[1.65] text-ink/70">{step.body}</p>
        </motion.article>
      ))}
    </div>
  );
}
