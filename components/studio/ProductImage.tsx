"use client";

import { useEffect, useRef, useState } from "react";
import { imageSrc } from "@/lib/studio/images";
import { initialOf } from "@/lib/studio/format";

type Props = {
  index: number;
  imageUrl?: string;
  /** Used for the alt text and the big letter on the fallback. */
  label: string;
  brandColor: string;
  className?: string;
  onLoad?: () => void;
  onFallback?: () => void;
  fallbackVariant?: "default" | "paper";
};

/**
 * One of the Kiln & Co. product photos. If the file isn't there yet, it shows a brand-coloured
 * panel with the brand's first letter instead, so the Studio looks finished before the photos exist.
 */
export default function ProductImage(props: Props) {
  return <Inner key={props.imageUrl ?? props.index} {...props} />; // remount when the chosen photo changes, so a failed one doesn't stick
}

function Inner({ index, imageUrl, label, brandColor, className = "", onLoad, onFallback, fallbackVariant = "default" }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before React is listening, so check once on mount too.
  // This mount check complements the image event handlers without re-firing parent callbacks on every render.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) {
      if (img.naturalWidth === 0) {
        setFailed(true);
        onFallback?.();
      } else {
        onLoad?.();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    if (fallbackVariant === "paper") {
      return (
        <div role="img" aria-label={`${label} (placeholder image)`} className={`flex items-center justify-center bg-card ${className}`}>
          <svg aria-hidden="true" viewBox="0 0 80 80" className="h-12 w-12 text-leaf">
            <path d="M40 68c0-18 1-34 0-52M40 43C25 34 15 39 8 49c14 4 25 2 32-6Zm0-11c13-9 23-6 31 2-12 6-22 5-31-2ZM40 18C30 15 26 9 28 3c8 2 11 7 12 15Zm0 0c10-3 14-9 12-15-8 2-11 7-12 15Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
      );
    }
    return (
      <div
        role="img"
        aria-label={`${label} (placeholder image)`}
        className={`flex items-center justify-center ${className}`}
        style={{ background: `linear-gradient(135deg, ${brandColor}, color-mix(in srgb, ${brandColor} 35%, #f7f3ec))` }}
      >
        <span aria-hidden="true" className="font-display text-7xl text-white/70">
          {initialOf(label)}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={imageUrl ?? imageSrc(index)}
      alt={imageUrl ? `AI-generated visual concept for ${label}` : `${label} product photo`}
      loading="lazy"
      decoding="async"
      onLoad={() => onLoad?.()}
      onError={() => {
      setFailed(true);
      onFallback?.();
      }}
      className={`object-cover ${className}`}
    />
  );
}
