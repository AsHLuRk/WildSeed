"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import FrameSequence, { type Phase } from "./FrameSequence";
import Hero from "./Hero";
import Loader from "./Loader";
import Nav from "./Nav";
import StoryBeats from "./StoryBeats";

export default function LandingStory() {
  const progress = useMotionValue(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [percent, setPercent] = useState(0);
  const bottomFade = useTransform(progress, [0.9, 1], [0, 1]);

  return (
    <>
      <Loader visible={phase === "loading"} percent={percent} />
      <Nav visible={phase !== "loading"} />
      <section id="top" aria-label="Wildseed">
        <FrameSequence progress={progress} onPhaseChange={setPhase} onLoadProgress={setPercent}>
          <Hero phase={phase} progress={progress} />
          <StoryBeats progress={progress} />
          {/* Blends the last frame into the page colour as the pinned stage scrolls away. */}
          <motion.div
            aria-hidden="true"
            style={{ opacity: bottomFade }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[28%] bg-gradient-to-t from-paper to-transparent"
          />
        </FrameSequence>
      </section>
    </>
  );
}
