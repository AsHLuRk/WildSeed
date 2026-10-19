"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Vine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[2vw] top-0 hidden w-12 lg:block">
      <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 48 1000" focusable="false">
        <motion.path d="M24 0 C8 120 40 210 20 330 S40 530 18 660 S34 820 24 1000" fill="none" stroke="var(--leaf)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ pathLength }} />
        {[18, 35, 52, 70, 86].map((top, index) => <motion.path key={top} d={index % 2 ? "M24 0 C18 8 8 10 2 8 C8 1 16 -2 24 0Z" : "M24 0 C30 8 40 10 46 8 C40 1 32 -2 24 0Z"} transform={`translate(0 ${top * 10})`} fill="var(--leaf)" initial={{ scale: 0, rotate: -12 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.1, type: "spring", stiffness: 180, damping: 14 }} />)}
      </svg>
    </div>
  );
}
