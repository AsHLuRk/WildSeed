"use client";

import Link from "next/link";
import type { SharePayload } from "@/lib/types";
import { GoogleAdPreview, InstagramPreview, LinkedInPreview, PreviewSurface } from "./Previews";

const ANGLES = ["Benefit-led", "Story-led", "Offer-led"];
const GOAL = { awareness: "Awareness", traffic: "Traffic", leads: "Leads", sales: "Sales" } as const;

/** Read-only presentation of a saved set of ideas. Prints cleanly (Save as PDF from the print dialog). */
export default function SharedAds({ payload }: { payload: SharePayload }) {
  const { brief, concepts, selectedId } = payload;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">FIG. 00 / Shared catalogue</p>
          <h1 className="mt-5 font-display text-[clamp(3rem,7vw,6.5rem)] leading-none tracking-[-0.03em] text-ink">{brief.productName}</h1>
          <p className="mt-3 max-w-xl text-ink/75">For {brief.audience}.</p>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink/70">
            <span className="border-b border-line px-1 py-1">Goal: {GOAL[brief.goal]}</span>
            {brief.tones.map((t) => (
              <span key={t} className="border-b border-line px-1 py-1 capitalize">
                {t}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 border-b border-line px-1 py-1">
              <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: brief.brandColor }} />
              {brief.brandColor}
            </span>
          </p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="border-b border-line px-1 py-2.5 text-sm text-ink hover:border-ink">
            Print or save as PDF
          </button>
          <Link href="/studio" className="rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-ink">
            Make your own
          </Link>
        </div>
      </header>

      <div className="mt-12 space-y-16">
        {concepts.map((c, i) => (
          <section key={c.id} aria-labelledby={`idea-${c.id}`} className="break-inside-avoid">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 id={`idea-${c.id}`} className="font-display text-3xl text-ink">
                Idea {i + 1}
              </h2>
              <p className="text-sm text-ink/60">{ANGLES[i] ?? "Concept"}</p>
              {c.id === selectedId && <span className="border-b border-leaf px-1 py-1 text-xs text-[#3f6b3e]">Favourite</span>}
            </div>
            <div className="mt-5">
              <PreviewSurface>
                <div className="grid items-start gap-6 lg:grid-cols-3">
                  <InstagramPreview concept={c} productName={brief.productName} brandColor={brief.brandColor} />
                  <LinkedInPreview concept={c} productName={brief.productName} brandColor={brief.brandColor} />
                  <GoogleAdPreview concept={c} productName={brief.productName} brandColor={brief.brandColor} />
                </div>
              </PreviewSurface>
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-ink/60">
        Made with Wildseed Studio. Wildseed is a fictional studio and the product is made up.
      </footer>
    </main>
  );
}
