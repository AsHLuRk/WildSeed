"use client";

import { motion, useReducedMotion } from "framer-motion";
import { resolveImageIndex } from "@/lib/studio/images";
import type { Notice } from "@/lib/studio/warnings";
import type { Brief, Concept, GenerateSource } from "@/lib/types";
import ProductImage from "./ProductImage";

const ANGLES = ["Benefit-led", "Story-led", "Offer-led"];

type Props = {
  brief: Brief;
  concepts: Concept[];
  pendingImageIds: ReadonlySet<string>;
  imageGenerationAvailable: boolean;
  imageNotice: string | null;
  loading: boolean;
  source: GenerateSource | null;
  notice: Notice | null;
  onEdit: (id: string) => void;
  onRegenerate: () => void;
  onBackToBrief: () => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
};

function Sprout() {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 100 80"
      className="h-20 w-24 text-leaf"
      initial={reduce ? false : { opacity: 0.4, pathLength: 0 }}
      animate={reduce ? undefined : { opacity: [0.4, 1, 0.4], pathLength: [0, 1, 1] }}
      transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M50 74c0-20 1-39 0-59M50 45C31 34 18 40 9 53c18 5 32 2 41-8Zm0-12c17-12 29-8 39 3-15 7-28 6-39-3ZM50 16C38 13 34 7 36 1c9 2 14 7 14 15Zm0 0c12-3 16-9 14-15-9 2-14 7-14 15Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </motion.svg>
  );
}

function MarginNote({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p role="status" data-testid={testId} className="mt-6 flex items-start gap-3 border-l-2 border-leaf pl-4 font-display text-[15px] italic leading-6 text-ink/75">
      <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rotate-45 border border-leaf" />
      <span>{children}</span>
    </p>
  );
}

function SkeletonCard() {
  return (
    <div aria-hidden="true" data-testid="skeleton" className="border-t border-line pt-5">
      <div className="flex aspect-[4/5] items-center justify-center border border-dashed border-leaf/60 bg-card">
        <Sprout />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-px w-20 bg-leaf" />
        <p className="font-display text-xl text-ink">Developing a concept...</p>
        <p className="text-sm text-ink/75">The artwork will appear when it is ready.</p>
      </div>
    </div>
  );
}

function PlateImage({ brief, concept, pending, reduce }: { brief: Brief; concept: Concept; pending: boolean; reduce: boolean | null }) {
  if (pending) {
    return (
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden" style={{ backgroundColor: `${brief.brandColor}1F` }}>
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-paper/40"
          animate={reduce ? undefined : { x: ["0%", "500%"] }}
          transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <Sprout />
        <span className="absolute bottom-4 left-4 text-[11px] tracking-[0.18em] text-ink/75 uppercase">Developing</span>
      </div>
    );
  }

  return (
    <motion.div
      className="relative aspect-[4/5] overflow-hidden"
      initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        initial={reduce ? false : { scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full w-full"
      >
        <ProductImage index={resolveImageIndex(concept)} imageUrl={concept.imageUrl} label={brief.productName} brandColor={brief.brandColor} className="h-full w-full object-cover" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-paper/6 mix-blend-multiply" />
      </motion.div>
    </motion.div>
  );
}

export default function ResultsBoard({ brief, concepts, pendingImageIds, imageGenerationAvailable, imageNotice, loading, source, notice, onEdit, onRegenerate, onBackToBrief, headingRef }: Props) {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="board-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] text-ink/60 uppercase">{loading ? "Writing" : "Your ideas"}</p>
          <h1 id="board-title" ref={headingRef} tabIndex={-1} className="mt-2 font-display text-4xl text-ink outline-none md:text-5xl">
            {loading ? `Writing ideas for ${brief.productName}…` : <>Three <em>ideas</em> for {brief.productName}</>}
          </h1>
        </div>
        {!loading && (
          <div className="flex min-h-11 flex-wrap items-center gap-5">
            <span data-testid="source-badge" className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-ink/75 uppercase">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-leaf" />
              {source === "ai" ? "Written by AI" : "Sample ideas"}
            </span>
            <button type="button" onClick={onBackToBrief} className="group/action relative min-h-11 px-0 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Edit brief
              <span aria-hidden="true" className="absolute right-0 bottom-1 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/action:scale-x-100 group-focus-visible/action:scale-x-100" />
            </button>
            <button type="button" onClick={onRegenerate} disabled={pendingImageIds.size > 0} className="group/action relative min-h-11 px-0 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50">
              Regenerate
              <span aria-hidden="true" className="absolute right-0 bottom-1 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/action:scale-x-100 group-focus-visible/action:scale-x-100" />
            </button>
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">{loading ? "Writing your ideas" : `${concepts.length} ideas ready`}</div>

      {!loading && notice && <MarginNote testId="notice">{notice.text}</MarginNote>}
      {!loading && !imageGenerationAvailable && <MarginNote>AI images aren’t configured for this server, so these cards are using fallback artwork. Provide the Cloudflare account ID and raw API token to the server runtime (without a ****** quotes, or whitespace), confirm the Supabase image bucket is set up, then restart and generate a new set.</MarginNote>}
      {!loading && pendingImageIds.size > 0 && <MarginNote>Creating images for your ideas. {pendingImageIds.size} {pendingImageIds.size === 1 ? "image remains" : "images remain"}; they’ll appear as they finish.</MarginNote>}
      {!loading && imageNotice && <MarginNote>{imageNotice}</MarginNote>}

      <div className="mt-12 grid gap-12 pb-12 md:grid-cols-3 lg:gap-10">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : concepts.map((c, i) => (
              <motion.article
                key={c.id}
                data-testid="concept-card"
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`group flex flex-col border-t border-line pt-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1 motion-safe:focus-within:-translate-y-1 ${i === 1 ? "lg:mt-10" : i === 2 ? "lg:mt-20" : ""}`}
              >
                <div className="text-[11px] tracking-[0.18em] text-ink/75 uppercase">
                  <span>Plate {["I", "II", "III"][i]}</span>
                  <span className="float-right">{ANGLES[i] ?? "Concept"}</span>
                </div>
                <div className="mt-4 border border-line bg-paper p-2">
                  <div className="overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-within:scale-[1.03]">
                    <PlateImage brief={brief} concept={c} pending={pendingImageIds.has(c.id)} reduce={reduce} />
                  </div>
                </div>
                <p className="mt-3 text-sm font-display italic text-ink/75">Fig. {i + 1} / {pendingImageIds.has(c.id) ? "Developing" : c.imageUrl ? "AI image concept" : "Placeholder art"}</p>
                <div className="mt-6">
                  <h2 className="font-display text-[1.75rem] leading-[1.15] text-ink">{c.headline}</h2>
                  <p className="mt-4 line-clamp-4 text-[17px] leading-[1.6] text-ink/75">{c.body}</p>
                  <p className="mt-4 text-sm font-medium text-ink">{c.cta}</p>
                  <p className="mt-1 text-sm text-ink/75">{c.hashtags.map((t) => `#${t}`).join(" ")}</p>
                  <button type="button" onClick={() => onEdit(c.id)} aria-label={`Edit idea ${i + 1}: ${c.headline}`} className="group/edit relative mt-6 inline-flex min-h-11 items-center gap-2 border-b border-ink px-0 py-2.5 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    Edit and preview
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover/edit:translate-x-1">-&gt;</span>
                  </button>
                </div>
              </motion.article>
            ))}
      </div>
    </section>
  );
}
