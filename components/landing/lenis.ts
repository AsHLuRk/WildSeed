import type Lenis from "lenis";

/** Tiny shared handle so the frame sequence can pause scrolling during the load intro. */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

/** Idempotent. Locks both Lenis (if running) and native scrolling. */
export function lockScroll(lock: boolean) {
  const html = document.documentElement;
  if (lock) {
    html.style.overflow = "hidden";
    instance?.stop();
  } else {
    html.style.overflow = "";
    instance?.start();
  }
}
