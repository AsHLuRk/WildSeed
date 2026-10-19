"use client";

import { useReducedMotion } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const DURATION = { fast: 0.4, base: 0.8, slow: 1.2 } as const;
export const VIEWPORT = { once: true, amount: 0.35 } as const;

export function useMotionAllowed() {
  return !useReducedMotion();
}
