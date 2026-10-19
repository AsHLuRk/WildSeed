"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export default function Bloom() {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 180 140"
      className="pointer-events-none absolute bottom-5 right-[8vw] hidden w-36 origin-bottom text-ink md:block"
      animate={reduced ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
      transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.g
        initial={reduced ? false : { scale: 0, rotate: -12 }}
        whileInView={reduced ? undefined : { scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: "50%", originY: "100%" }}
      >
        <path d="M90 126 C88 96 90 62 91 29" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M90 87 C70 76 55 80 42 94 C61 99 78 97 90 87Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M91 72 C110 60 125 64 139 78 C119 84 103 81 91 72Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M91 36 C70 32 59 20 61 5 C78 8 89 18 91 36Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M92 36 C111 31 123 20 121 5 C105 8 94 18 92 36Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M91 36 C85 19 88 7 91 0 C98 10 98 23 91 36Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </motion.g>
    </motion.svg>
  );
}
