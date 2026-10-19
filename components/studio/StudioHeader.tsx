import Link from "next/link";
import { motion } from "framer-motion";

export type StudioStage = "brief" | "generating" | "board" | "editor";

const STEPS = ["Brief", "Ideas", "Edit and share"] as const;
const stepOf = (s: StudioStage) => (s === "brief" ? 0 : s === "editor" ? 2 : 1);

function Marker({ step, state }: { step: number; state: "complete" | "current" | "upcoming" }) {
  const color = state === "upcoming" ? "text-ink/35" : "text-leaf";
  return (
    <span className={`relative flex h-7 w-7 items-center justify-center ${color} ${state === "complete" ? "rounded-full border border-leaf bg-[#DCE6D5]" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 28 28" className="h-7 w-7 overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        {step === 0 && <path d="M14 21c-4.7-1.2-7.1-4.6-6.1-8.2 3.8-.5 7.2 2.1 6.1 8.2Zm0 0c4.7-1.2 7.1-4.6 6.1-8.2-3.8-.5-7.2 2.1-6.1 8.2ZM14 21V7" />}
        {step === 1 && <><path d="M14 23V7M14 15c-4.4.1-6.7-2.1-7.4-5.6 4.2-.5 6.7 1.5 7.4 5.6Zm0-3.3c3.9 0 6.1-2 6.7-5.2-3.8-.5-6 1.3-6.7 5.2Z" /></>}
        {step === 2 && <><path d="M14 24V12M14 12C9.8 10.5 7.2 7.5 7.8 4c3.7.1 6 2.1 6.2 6.1C14.3 6.1 16.5 4.1 20.2 4c.6 3.5-2 6.5-6.2 8Z" /><path d="M14 19c-3.5-1.1-5.4-3.2-5.1-5.7 3.1.1 4.9 1.7 5.1 5.7Zm0 0c3.5-1.1 5.4-3.2 5.1-5.7-3.1.1-4.9 1.7-5.1 5.7Z" /></>}
      </svg>
      {state === "complete" && <span className="absolute -right-1 -bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#DCE6D5] text-[9px] font-bold text-leaf">✓</span>}
      {state === "current" && <motion.span className="absolute right-0 bottom-[-5px] left-0 h-px origin-left bg-leaf" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4 }} />}
    </span>
  );
}

export default function StudioHeader({ stage }: { stage: StudioStage }) {
  const current = stepOf(stage);
  return (
    <header className="border-b border-line print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-5 sm:py-4 md:flex-nowrap md:px-8">
        <Link href="/" className="font-display text-2xl text-ink">
          Wildseed <span className="ml-1 font-sans text-sm text-ink/55">Studio</span>
        </Link>
        <ol aria-label="Progress" className="flex max-w-full items-start text-[10px] tracking-[0.12em] text-ink/60 uppercase sm:text-[11px] sm:tracking-[0.16em]">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-start">
              <div aria-current={i === current ? "step" : undefined} className={`flex items-center gap-2 ${i === current ? "font-medium text-ink" : i < current ? "text-leaf" : "text-ink/50"}`}>
                <Marker step={i} state={i < current ? "complete" : i === current ? "current" : "upcoming"} />
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="relative mx-2 mt-3 h-px w-6 bg-line md:mx-4 md:w-12">
                  <motion.span className="absolute inset-0 origin-left bg-leaf" initial={{ scaleX: 0 }} animate={{ scaleX: i < current ? 1 : 0 }} transition={{ duration: 0.5 }} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
