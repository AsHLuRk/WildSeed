/**
 * The text beats shown over the animation. `start` and `end` are windows of the
 * scroll progress AFTER the load intro (0 = intro just ended, 1 = last frame).
 * All copy is fictional sample content. Tune the windows after watching your real clips.
 */
export type Beat = {
  id: string;
  number: string;
  title: string;
  body: string;
  start: number;
  end: number;
  side: "left" | "right";
};

export const BEATS: Beat[] = [
  {
    id: "plant",
    number: "01",
    title: "Plant the idea",
    body: "Strategy starts with listening: your customers, your numbers.",
    start: 0.03,
    end: 0.16,
    side: "left",
  },
  {
    id: "grow",
    number: "02",
    title: "Grow the story",
    body: "Creative that gives people a reason to care.",
    start: 0.18,
    end: 0.3,
    side: "right",
  },
  {
    id: "light",
    number: "03",
    title: "Reach the light",
    body: "Media placed where your buyers already are.",
    start: 0.36,
    end: 0.55,
    side: "left",
  },
  {
    id: "bloom",
    number: "04",
    title: "Let it bloom",
    body: "Steady, measured growth you can see in the data.",
    start: 0.58,
    end: 0.76,
    side: "right",
  },
];

/** The last beat stays on screen (it holds the call to action). */
export const FINALE = {
  start: 0.8,
  fadeEnd: 0.86,
  title: "Let’s plant something.",
  body: "Tell us what you want to grow, or try the studio and see what we would write for your brand.",
  cta: "Try the Studio",
  href: "/studio",
};
