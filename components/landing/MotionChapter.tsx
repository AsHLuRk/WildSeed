"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { EASE, VIEWPORT, useMotionAllowed } from "@/lib/landing/motion";

type Service = { n: string; title: string; tag: string; body: string; items: string[] };

export default function MotionChapter({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [index % 2 ? 24 : -24, index % 2 ? -24 : 24]);
  const motionAllowed = useMotionAllowed();
  return (
    <motion.article ref={ref} initial={motionAllowed ? { opacity: 0 } : false} whileInView={motionAllowed ? { opacity: 1 } : undefined} viewport={VIEWPORT} transition={{ duration: 0.8, ease: EASE }} className={`border-t border-line py-12 md:py-16 ${index === 1 ? "lg:ml-10" : index === 2 ? "lg:ml-20" : ""}`}>
      <div className="flex items-start gap-5">
        <motion.p style={motionAllowed ? { y } : undefined} className="font-display text-[clamp(5rem,9vw,9rem)] leading-[0.75] tracking-[-0.04em] text-coral [-webkit-text-stroke:1px_var(--coral)]">{service.n}</motion.p>
        <div className="pt-2">
          <h3 className="font-display text-4xl leading-none tracking-[-0.02em] text-ink md:text-5xl">{service.title}</h3>
          <p className="mt-2 font-display text-lg italic text-leaf">{service.tag}</p>
        </div>
      </div>
      <p className="mt-8 max-w-xl text-[17px] leading-[1.65] text-ink/75">{service.body}</p>
      <ul className="mt-8 max-w-xl">
        {service.items.map((item) => <li key={item} className="group flex gap-3 border-t border-line py-3 text-[15px] text-ink/80 transition-transform hover:translate-x-2"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rotate-45 border border-leaf transition-transform group-hover:scale-125" />{item}</li>)}
      </ul>
    </motion.article>
  );
}
