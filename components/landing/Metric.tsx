"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE } from "@/lib/landing/motion";

export default function Metric({ value, label, figure, lead = false, offset = false }: { value: string; label: string; figure: string; lead?: boolean; offset?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!inView || value.includes("x") === false && value.includes("%") === false) return;
    const target = Number.parseFloat(value);
    if (!Number.isFinite(target)) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(`${value.includes("+") ? "+" : ""}${(target * eased).toFixed(value.includes("x") ? 1 : 0)}${value.includes("x") ? "x" : "%"}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);
  return (
    <div ref={ref} className={`${lead ? "sm:col-span-2 lg:col-span-4" : "lg:col-span-3"} ${offset ? "lg:mt-20" : ""} border-t border-line pt-5`}>
      <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">{figure}</p>
      <p aria-label={value} className={`mt-5 font-display tabular-nums tracking-[-0.04em] text-ink ${lead ? "text-[clamp(6rem,15vw,13rem)] leading-[0.75]" : "text-[clamp(3.5rem,7vw,6rem)] leading-none"}`}>{shown}</p>
      <svg aria-hidden="true" viewBox="0 0 180 38" className="mt-6 h-10 w-full max-w-[12rem] text-leaf">
        <motion.path d="M1 32 C22 29 25 16 45 21 S68 30 88 15 S116 11 133 18 S157 13 179 2" fill="none" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} />
      </svg>
      <p className="mt-2 max-w-[18ch] text-sm leading-6 text-ink/65">{label}</p>
    </div>
  );
}
