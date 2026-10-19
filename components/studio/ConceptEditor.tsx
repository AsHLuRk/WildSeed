"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ApiError, generateConceptImage } from "@/lib/client";
import { bodyCounters, headlineCounters } from "@/lib/studio/limits";
import { formatHashtags, parseHashtags } from "@/lib/studio/format";
import { IMAGE_COUNT, resolveImageIndex } from "@/lib/studio/images";
import type { Brief, Concept } from "@/lib/types";
import CounterPill from "./Counter";
import ProductImage from "./ProductImage";
import { PreviewTabs, type PlatformTab } from "./Previews";

type Props = {
  brief: Brief;
  concept: Concept;
  index: number;
  tab: PlatformTab;
  onTab: (t: PlatformTab) => void;
  onChange: (c: Concept) => void;
  imageGenerationAvailable: boolean;
  imagePending: boolean;
  onImageReady: (imageUrl: string) => void;
  onReset: () => void;
  onBack: () => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
  /** Shown between the heading and the editor (the share bar). */
  slot?: ReactNode;
};

const field =
  "w-full border-0 border-b border-ink/35 bg-transparent px-0 py-3 text-base text-ink outline-none focus:border-leaf focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf";

function SproutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="h-full w-full">
      <path d="M14 25V8M14 16c-5-1-7-4-7-8 4-.2 6.5 2.2 7 8Zm0-4c4.5-1 6.5-3.8 6.5-7.2-4-.1-6.2 2.1-6.5 7.2Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function ConceptEditor({ brief, concept, index, tab, onTab, onChange, imageGenerationAvailable, imagePending, onImageReady, onReset, onBack, headingRef, slot }: Props) {
  // Hashtags are edited as free text and only tidied up when you leave the field.
  // (The parent remounts this component with a new key after a reset, so this starts fresh.)
  const [rawTags, setRawTags] = useState(() => formatHashtags(concept.hashtags));
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(() => new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(() => new Set());
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLTextAreaElement>(null);
  const reduce = useReducedMotion();
  const selectedImage = resolveImageIndex(concept);
  const patch = (p: Partial<Concept>) => onChange({ ...concept, ...p });

  const generateImage = async () => {
    if (!imageGenerationAvailable || imageBusy) return;
    setImageError(null);
    setImageBusy(true);
    try {
      const result = await generateConceptImage(brief, concept);
      onImageReady(result.imageUrl);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      setImageError(
        code === "image_rate_limited"
          ? "You’ve generated several images recently. Try again later."
          : code === "image_daily_cap_reached"
            ? "The image generation limit for today has been reached. Try again tomorrow."
            : code === "image_generation_not_configured"
              ? "Check the Cloudflare account ID and server token. CLOUDFLARE_API_TOKEN must be the raw token only, without a Bearer prefix, quotes or whitespace. Restart the server after updating it."
              : code === "image_storage_not_configured"
                ? "Configure Supabase to save generated images for share links."
                : code === "image_storage_not_ready"
                  ? "Run supabase/generated-images.sql in the Supabase SQL Editor, then try again."
                : "Image generation failed. Check the Cloudflare settings, quota, and Supabase image bucket, then try again."
      );
    } finally {
      setImageBusy(false);
    }
  };

  const chooseStaticImage = (image: number) => {
    const next = { ...concept, image };
    delete next.imageUrl;
    onChange(next);
  };
  const resize = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };
  useEffect(() => {
    resize(bodyRef.current);
    resize(visualRef.current);
  }, [concept.body, concept.visualDirection]);
  const headlineRows = headlineCounters(concept).sort((a, b) => (a.platform.toLowerCase() === tab ? -1 : 0) - (b.platform.toLowerCase() === tab ? -1 : 0));
  const bodyRows = bodyCounters(concept).sort((a, b) => (a.platform.toLowerCase() === tab ? -1 : 0) - (b.platform.toLowerCase() === tab ? -1 : 0));
  const availableImages = Array.from({ length: IMAGE_COUNT }, (_, i) => i).filter((i) => !failedImages.has(i) && (loadedImages.has(i) || i === selectedImage));
  const visibleImages = availableImages.length ? availableImages : [selectedImage];

  return (
    <section aria-labelledby="editor-title">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">Idea {index + 1} · {["Benefit-led", "Story-led", "Offer-led"][index] ?? "Concept"}</p>
          <h1 id="editor-title" ref={headingRef} tabIndex={-1} className="mt-4 font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-none tracking-[-0.03em] text-ink outline-none">
            Edit and <em>preview</em>
          </h1>
        </div>
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start sm:gap-5">
          <button type="button" onClick={onBack} className="group/action relative flex min-h-11 items-center gap-2 px-0 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <span aria-hidden="true">&lt;-</span> Back to ideas
            <span aria-hidden="true" className="absolute right-0 bottom-1 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/action:scale-x-100 group-focus-visible/action:scale-x-100" />
          </button>
          <button type="button" onClick={onReset} className="group/action relative flex min-h-11 items-center px-0 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            Reset this idea
            <span aria-hidden="true" className="absolute right-0 bottom-1 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/action:scale-x-100 group-focus-visible/action:scale-x-100" />
          </button>
        </div>
      </div>

      {slot}

      <div className="mt-6 grid gap-8 sm:mt-8 sm:gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="order-2 max-w-[30rem] space-y-14 lg:order-1">
          <section aria-labelledby="words-title" className="space-y-7">
            <h2 id="words-title" className="flex items-center gap-4 border-b border-line pb-3 text-[11px] tracking-[0.18em] text-ink/70 uppercase"><span className="font-display text-xl text-coral">01</span> The words</h2>
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.6, delay: 0.06 }}>
            <label htmlFor="headline" className="mb-2 block text-[11px] tracking-[0.18em] text-ink/60 uppercase">
              Headline
            </label>
            <input id="headline" className={field} value={concept.headline} maxLength={120} onChange={(e) => patch({ headline: e.target.value })} />
            <div className="mt-4 space-y-3" aria-label="Headline length by platform">
              {headlineRows.map((r) => (
                <CounterPill key={r.id} row={r} activePlatform={tab} />
              ))}
            </div>
          </motion.div>

          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.6, delay: 0.12 }}>
            <label htmlFor="body" className="mb-2 block text-[11px] tracking-[0.18em] text-ink/60 uppercase">
              Main text
            </label>
            <textarea ref={bodyRef} id="body" rows={3} className={`${field} resize-none overflow-hidden font-sans text-[18px] leading-[1.6]`} value={concept.body} maxLength={600} onChange={(e) => patch({ body: e.target.value })} />
            <div className="mt-4 space-y-3" aria-label="Main text length by platform">
              {bodyRows.map((r) => (
                <CounterPill key={r.id} row={r} activePlatform={tab} />
              ))}
            </div>
          </motion.div>

          <div className="grid gap-7 md:grid-cols-[2fr_3fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.6, delay: 0.18 }}>
            <label htmlFor="cta" className="mb-2 block text-[11px] tracking-[0.18em] text-ink/60 uppercase">
              Button text
            </label>
            <input id="cta" className={field} value={concept.cta} maxLength={40} onChange={(e) => patch({ cta: e.target.value })} />
          </motion.div>

          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.6, delay: 0.24 }}>
            <label htmlFor="hashtags" className="mb-2 block text-[11px] tracking-[0.18em] text-ink/60 uppercase">
              Hashtags
            </label>
            <input
              id="hashtags"
              className={field}
              value={rawTags}
              aria-describedby="hashtags-hint"
              onChange={(e) => {
                setRawTags(e.target.value);
                patch({ hashtags: parseHashtags(e.target.value) });
              }}
              onBlur={() => setRawTags(formatHashtags(concept.hashtags))}
            />
            <p id="hashtags-hint" className="mt-1.5 text-sm text-ink/60">
              Separate with spaces or commas. Up to 10.
            </p>
          </motion.div>
          </div>
          </section>

          <section aria-labelledby="picture-title" className="space-y-7">
            <h2 id="picture-title" className="flex items-center gap-4 border-b border-line pb-3 text-[11px] tracking-[0.18em] text-ink/70 uppercase"><span className="font-display text-xl text-coral">02</span> The picture</h2>
          <fieldset>
            <legend className="sr-only">Product image</legend>
            <div role="radiogroup" aria-label="Product image" className="flex flex-wrap gap-4">
              {visibleImages.map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={!concept.imageUrl && selectedImage === i}
                  aria-label={failedImages.has(i) ? "Placeholder art" : `Photo ${i + 1}`}
                  disabled={imagePending}
                  onClick={() => chooseStaticImage(i)}
                  className={`w-[72px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${!concept.imageUrl && selectedImage === i ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-ink/50"}`}
                >
                  <span className="block border border-line bg-paper p-1"><ProductImage index={i} label={brief.productName} brandColor={brief.brandColor} fallbackVariant="paper" onLoad={() => setLoadedImages((current) => new Set(current).add(i))} onFallback={() => setFailedImages((current) => new Set(current).add(i))} className="aspect-square w-full" /></span>
                  <span className="mt-2 block text-[10px] tracking-[0.12em] text-ink/75 uppercase">{failedImages.has(i) ? "Placeholder art" : `AI ${i + 1}`}</span>
                </button>
              ))}
              {concept.imageUrl && (
                <button
                  type="button"
                  role="radio"
                  aria-checked="true"
                  aria-label="AI-generated image"
                  onClick={() => onChange(concept)}
                  className="w-[72px] ring-2 ring-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="block border border-line bg-paper p-1"><ProductImage index={selectedImage} imageUrl={concept.imageUrl} label={brief.productName} brandColor={brief.brandColor} className="aspect-square w-full" /></span>
                  <span className="mt-2 block text-[10px] tracking-[0.12em] text-ink/75 uppercase">AI image</span>
                </button>
              )}
            </div>
            <div className="mt-5">
              <label htmlFor="visual" className="mb-2 block text-[11px] tracking-[0.18em] text-ink/60 uppercase">
                Image direction
              </label>
              <textarea ref={visualRef} id="visual" rows={2} className={`${field} resize-none overflow-hidden font-sans text-[17px] leading-[1.6]`} value={concept.visualDirection} maxLength={300} aria-describedby="visual-hint" onChange={(e) => patch({ visualDirection: e.target.value })} />
              <p id="visual-hint" className="mt-1.5 text-sm text-ink/60">
                Guides the next AI image. Edit it, then press Generate another image.
              </p>
            </div>
            <div className="mt-5">
              {imageBusy || imagePending ? <span className="inline-flex min-h-11 items-center gap-2 text-sm text-ink"><span className="h-7 w-7 text-leaf"><SproutIcon /></span> Developing…</span> : (
              <button
                type="button"
                onClick={generateImage}
                disabled={!imageGenerationAvailable || imageBusy || imagePending}
                className="group/action relative min-h-11 border-b border-ink px-0 py-2.5 text-sm font-medium text-ink transition-colors hover:border-leaf disabled:cursor-not-allowed disabled:opacity-50"
              >
                {imageBusy || imagePending ? "Creating image…" : concept.imageUrl ? "Generate another image" : "Generate an image with AI"}
              </button>)}
              <p className="mt-5 flex items-start gap-3 border-l-2 border-leaf pl-4 font-display text-[15px] italic leading-6 text-ink/75"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rotate-45 border border-leaf" />Uses the product name and description as facts. AI visuals are concepts; check them against your real product before publishing.</p>
              {!imageGenerationAvailable && (
                <p className="mt-1 text-sm text-ink/60">
                  Provide Cloudflare credentials to the server runtime, enable image generation, and run <code>supabase/generated-images.sql</code> to turn this on.
                </p>
              )}
              {imageError && <p role="alert" className="mt-2 text-sm text-[#a13e32]">{imageError}</p>}
            </div>
          </fieldset>

          </section>
        </div>

        <div className="order-1 lg:sticky lg:top-6 lg:order-2 lg:self-start">
          <PreviewTabs tab={tab} onTab={onTab} concept={concept} productName={brief.productName} brandColor={brief.brandColor} />
        </div>
      </div>
    </section>
  );
}
