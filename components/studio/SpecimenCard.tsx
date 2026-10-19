"use client";

import { motion, useReducedMotion } from "framer-motion";
import { readableBrandText } from "@/lib/studio/color";
import type { BriefValues } from "@/lib/studio/validation";

export default function SpecimenCard({ values }: { values: BriefValues }) {
  const reduce = useReducedMotion();
  const color = /^#[0-9a-fA-F]{6}$/.test(values.brandColor) ? values.brandColor : "#F0674E";
  const name = values.productName.trim() || "Your brand";
  return (
    <motion.div
      className="mx-auto max-w-[22rem] border border-line bg-card shadow-[0_18px_50px_rgb(31_42_36_/_0.08)]"
      whileHover={reduce ? undefined : { rotateX: -2, rotateY: 2 }}
      transition={{ duration: 0.35 }}
      style={{ perspective: 900 }}
    >
      <svg aria-hidden="true" className="block h-4 w-full text-paper" preserveAspectRatio="none" viewBox="0 0 220 16"><path d="m0 0 11 8L22 0l11 8L44 0l11 8L66 0l11 8L88 0l11 8L110 0l11 8 11-8 11 8 11-8 11 8 11-8 11 8 11-8 11 8 11-8v16H0Z" fill="currentColor" /></svg>
      <div className="px-6 py-10" style={{ backgroundColor: color, color: readableBrandText(color) }}>
        <p className="text-[10px] tracking-[0.2em] uppercase">Seed packet / FIG. 01</p>
        <h2 className={`mt-5 font-display text-4xl leading-none ${values.productName.trim() ? "" : "italic opacity-50"}`}>{name}</h2>
      </div>
      <div className="p-6">
        <svg aria-hidden="true" viewBox="0 0 220 120" className="h-28 w-full text-leaf"><path d="M110 112c0-30 2-55 0-88M110 77c-32-22-55-13-75 8 28 9 54 7 75-8Zm0-20c30-22 52-16 70 2-25 12-50 10-70-2ZM110 30C88 24 78 13 82 2c17 4 26 13 28 28Zm0 0c21-6 31-17 27-28-16 4-25 13-27 28Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        <div className="space-y-2 border-t border-line pt-5 text-sm italic text-ink/70">
          <p>Purpose: {values.goal ? values.goal[0].toUpperCase() + values.goal.slice(1) : "Sales"}</p>
          <p>Voice: {values.tones.length ? values.tones.map((tone) => tone[0].toUpperCase() + tone.slice(1)).join(", ") : "Premium, Minimal"}</p>
          <p>Packed for: {values.audience || "your audience"}</p>
        </div>
      </div>
    </motion.div>
  );
}
