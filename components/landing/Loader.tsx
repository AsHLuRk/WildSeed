"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function Loader({ visible, percent }: { visible: boolean; percent: number }) {
  return (
    <>
      <noscript>
        <style>{".wildseed-loader{display:none!important}"}</style>
      </noscript>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="loader"
            className="wildseed-loader fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-paper"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            role="status"
            aria-live="polite"
            aria-label="Loading"
          >
            <p className="font-display text-3xl text-ink">Wildseed</p>
            <div className="h-px w-40 overflow-hidden bg-line">
              <div className="h-full bg-leaf transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs tracking-[0.2em] text-ink/60 uppercase">{percent}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
