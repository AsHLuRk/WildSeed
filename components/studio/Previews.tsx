"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { toPlatformCopy } from "@/lib/platforms";
import { handleOf, initialOf, siteOf } from "@/lib/studio/format";
import { resolveImageIndex } from "@/lib/studio/images";
import type { Concept } from "@/lib/types";
import ProductImage from "./ProductImage";

export type PreviewProps = { concept: Concept; productName: string; brandColor: string };

/* Generic stand-ins for each platform's look. No real logos or trademarks are used. */

const icon = "h-6 w-6";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Heart = () => (
  <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);
const Comment = () => (
  <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
  </svg>
);
const Send = () => (
  <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}>
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z" />
  </svg>
);
const Bookmark = () => (
  <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}>
    <path d="M6 4h12v17l-6-4-6 4V4z" />
  </svg>
);
const Dots = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#737373]" aria-hidden="true" fill="currentColor">
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" {...stroke}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function Avatar({ name, color, round = true, size = 32 }: { name: string; color: string; round?: boolean; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-semibold text-white ${round ? "rounded-full" : "rounded-sm"}`}
      style={{ background: color, width: size, height: size, fontSize: size * 0.45 }}
    >
      {initialOf(name)}
    </span>
  );
}

export function InstagramPreview({ concept, productName, brandColor }: PreviewProps) {
  const copy = toPlatformCopy(concept).instagram;
  const handle = handleOf(productName);
  return (
    <article
      aria-label="Instagram post preview"
      className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-[#dbdbdb] bg-white text-[#262626] shadow-sm"
    >
      <header className="flex items-center gap-3 px-3 py-2.5">
        <Avatar name={productName} color={brandColor} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{handle}</p>
          <p className="text-xs text-[#737373]">Sponsored</p>
        </div>
        <Dots />
      </header>
      <ProductImage index={resolveImageIndex(concept)} imageUrl={concept.imageUrl} label={productName} brandColor={brandColor} className="aspect-square w-full" />
      <div className="flex items-center justify-between bg-[#efefef] px-3 py-2 text-sm font-semibold text-[#00376b]">
        <span>{concept.cta}</span>
        <Chevron />
      </div>
      <div className="flex items-center gap-4 px-3 pt-3">
        <Heart />
        <Comment />
        <Send />
        <span className="ml-auto">
          <Bookmark />
        </span>
      </div>
      <div className="px-3 pt-2 pb-4 text-sm leading-snug">
        <p className="whitespace-pre-line">
          <span className="font-semibold">{handle}</span> {copy.caption}
        </p>
        {copy.hashtags.length > 0 && <p className="mt-1 text-[#00376b]">{copy.hashtags.map((t) => `#${t}`).join(" ")}</p>}
      </div>
    </article>
  );
}

export function LinkedInPreview({ concept, productName, brandColor }: PreviewProps) {
  const copy = toPlatformCopy(concept).linkedin;
  return (
    <article
      aria-label="LinkedIn ad preview"
      className="mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border border-[#e0dfdc] bg-white text-[#191919] shadow-sm"
    >
      <header className="flex items-start gap-2.5 px-4 pt-3">
        <Avatar name={productName} color={brandColor} round={false} size={48} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{productName}</p>
          <p className="mt-0.5 text-xs text-[#666666]">Promoted</p>
        </div>
        <Dots />
      </header>
      <p className="px-4 py-3 text-sm leading-snug whitespace-pre-line">{copy.introText}</p>
      <ProductImage index={resolveImageIndex(concept)} imageUrl={concept.imageUrl} label={productName} brandColor={brandColor} className="aspect-[1.91/1] w-full" />
      <div className="flex items-center gap-3 bg-[#f3f2ef] px-4 py-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{copy.headline}</p>
          <p className="mt-0.5 truncate text-xs text-[#666666]">{siteOf(productName)}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[#0a66c2] px-4 py-1.5 text-sm font-semibold text-[#0a66c2]">{copy.cta}</span>
      </div>
      <div className="flex justify-around border-t border-[#e0dfdc] px-2 py-2 text-xs font-semibold text-[#666666]">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </article>
  );
}

export function GoogleAdPreview({ concept, productName, brandColor }: PreviewProps) {
  const copy = toPlatformCopy(concept).google;
  return (
    <article
      aria-label="Google search ad preview"
      className="mx-auto w-full max-w-[600px] rounded-xl border border-[#dfe1e5] bg-white p-4 text-[#202124] shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Avatar name={productName} color={brandColor} size={28} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm">
            <span className="font-semibold">Sponsored</span> · {productName}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#4d5156]">{siteOf(productName)} › shop</p>
        </div>
      </div>
      <h3 className="mt-2 text-xl leading-snug text-[#1a0dab]">{copy.headline}</h3>
      <p className="mt-1 text-sm leading-snug text-[#4d5156]">{copy.description}</p>
    </article>
  );
}

/* ---------- tabs ---------- */

export const PLATFORM_TABS = [
  { key: "instagram", label: "Instagram", Preview: InstagramPreview },
  { key: "linkedin", label: "LinkedIn", Preview: LinkedInPreview },
  { key: "google", label: "Google", Preview: GoogleAdPreview },
] as const;

export type PlatformTab = (typeof PLATFORM_TABS)[number]["key"];

/** A neutral surface so the white platform cards stand out against the page. */
export function PreviewSurface({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-line bg-[#efe9dd] p-4 md:p-8">{children}</div>;
}

export function PreviewTabs({ tab, onTab, ...preview }: PreviewProps & { tab: PlatformTab; onTab: (t: PlatformTab) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (e: KeyboardEvent, i: number) => {
    const last = PLATFORM_TABS.length - 1;
    const next = e.key === "ArrowRight" ? (i + 1) % (last + 1) : e.key === "ArrowLeft" ? (i + last) % (last + 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    const key = PLATFORM_TABS[next].key;
    onTab(key);
    refs.current[key]?.focus();
  };

  const Active = PLATFORM_TABS.find((t) => t.key === tab)!.Preview;

  return (
    <div>
      <div role="tablist" aria-label="Platform preview" className="mb-4 inline-flex rounded-full border border-line bg-card p-1">
        {PLATFORM_TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[t.key] = el;
            }}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="preview-panel"
            tabIndex={tab === t.key ? 0 : -1}
            onClick={() => onTab(t.key)}
            onKeyDown={(e) => move(e, i)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${tab === t.key ? "bg-ink text-paper" : "text-ink/70 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="preview-panel" aria-labelledby={`tab-${tab}`}>
        <PreviewSurface>
          <Active {...preview} />
        </PreviewSurface>
      </div>
    </div>
  );
}
