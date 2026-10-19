"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#proof", label: "Results" },
];

export default function Nav({ visible }: { visible: boolean }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-paper/70 px-5 py-4 backdrop-blur-md md:px-10"
    >
      <a href="#top" className="font-display text-2xl text-ink">
        Wildseed
      </a>
      <nav aria-label="Primary" className="flex items-center gap-6">
        <ul className="hidden items-center gap-6 text-sm text-ink/80 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Link
          href="/studio"
          className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
        >
          Try the Studio
        </Link>
      </nav>
    </motion.header>
  );
}
