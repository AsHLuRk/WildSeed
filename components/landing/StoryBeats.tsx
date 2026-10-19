"use client";

import Link from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { BEATS, FINALE, type Beat } from "@/lib/landing/beats";

const FADE = 0.04;

function BeatView({ beat, progress }: { beat: Beat; progress: MotionValue<number> }) {
  const range = [beat.start, beat.start + FADE, beat.end - FADE, beat.end];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [28, 0, 0, -28]);

  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute inset-x-0 bottom-[5svh] z-10 flex justify-center px-6 md:inset-y-0 md:items-center md:px-[6vw] ${
        beat.side === "left" ? "md:justify-start" : "md:justify-end"
      }`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-paper/90 p-4 backdrop-blur-sm sm:p-5 md:max-w-sm md:bg-transparent md:p-0 md:backdrop-blur-none">
        <p className="font-display text-4xl text-coral sm:text-5xl md:text-6xl">{beat.number}</p>
        <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl md:text-5xl">{beat.title}</h2>
        <p className="mt-3 text-[15px] leading-6 text-ink/75 md:text-lg">{beat.body}</p>
      </div>
    </motion.div>
  );
}

function Finale({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [FINALE.start, FINALE.fadeEnd, 1], [0, 1, 1]);
  const y = useTransform(progress, [FINALE.start, FINALE.fadeEnd, 1], [28, 0, 0]);
  const pointerEvents = useTransform(progress, (v) => (v > FINALE.fadeEnd - 0.02 ? "auto" : "none"));

  // Same placement rules as the beats: bottom card on phones, left of the plant on desktop.
  // It must never sit over the bloom, which is the best frame of the whole animation.
  return (
    <motion.div
      style={{ opacity, y, pointerEvents }}
      className="absolute inset-x-0 bottom-[5svh] z-10 flex justify-center px-6 md:inset-y-0 md:items-center md:justify-start md:px-[6vw]"
    >
      <div className="w-full max-w-sm rounded-2xl bg-paper/90 p-4 text-center backdrop-blur-sm sm:p-5 md:max-w-sm md:bg-transparent md:p-0 md:text-left md:backdrop-blur-none">
        <h2 className="font-display text-2xl leading-tight text-ink sm:text-3xl md:text-6xl">{FINALE.title}</h2>
        <p className="mt-4 hidden text-base text-ink/75 md:block md:text-lg">{FINALE.body}</p>
        <Link
          href={FINALE.href}
          className="mt-4 inline-block min-h-11 rounded-full bg-coral px-7 py-3 text-base font-medium text-ink transition-transform hover:scale-[1.03] md:mt-6"
        >
          {FINALE.cta}
        </Link>
      </div>
    </motion.div>
  );
}

export default function StoryBeats({ progress }: { progress: MotionValue<number> }) {
  return (
    <>
      {BEATS.map((beat) => (
        <BeatView key={beat.id} beat={beat} progress={progress} />
      ))}
      <Finale progress={progress} />
    </>
  );
}
