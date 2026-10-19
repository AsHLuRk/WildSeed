"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ApiError, generateConceptImage, generateConcepts, getStatus, saveShare } from "@/lib/client";
import { DEMO_BRIEF, getDemoConcepts } from "@/lib/sampleConcepts";
import { shareSchema } from "@/lib/schemas";
import { describeResult, type ResultWarning } from "@/lib/studio/warnings";
import { EMPTY_VALUES, toValues, validateBrief, type BriefErrors, type BriefField, type BriefValues } from "@/lib/studio/validation";
import type { Brief, Concept, GenerateSource, StatusResponse } from "@/lib/types";
import BriefForm from "./BriefForm";
import ConceptEditor from "./ConceptEditor";
import type { PlatformTab } from "./Previews";
import ResultsBoard from "./ResultsBoard";
import ShareBar, { type ShareUi } from "./ShareBar";
import StudioHeader, { type StudioStage } from "./StudioHeader";
import SpecimenCard from "./SpecimenCard";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const FOCUS_ORDER: BriefField[] = ["productName", "audience", "description", "brandColor"];

type Outcome = { concepts: Concept[]; source: GenerateSource; warning?: ResultWarning; retryAfterSeconds?: number };

const SHARE_ERRORS: Record<string, string> = {
  share_not_configured: "Sharing isn’t set up on this site.",
  rate_limited: "You’ve saved a lot of links in a short time. Try again in a while.",
  invalid_request: "Every idea needs a headline, main text, button text and image direction before it can be shared.",
};

export default function StudioApp() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<StudioStage>("brief");
  const [values, setValues] = useState<BriefValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<BriefErrors>({});
  const [brief, setBrief] = useState<Brief | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [originals, setOriginals] = useState<Concept[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Omit<Outcome, "concepts"> | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [pendingImageIds, setPendingImageIds] = useState<Set<string>>(() => new Set());
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<PlatformTab>("instagram");
  const [share, setShare] = useState<ShareUi>({ phase: "idle" });
  const [resetCount, setResetCount] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const userMoved = useRef(false);
  const imageRunId = useRef(0);

  useEffect(() => {
    let alive = true;
    getStatus()
      .then((s) => alive && setStatus(s))
      .catch(() => undefined); // no status just means "no AI toggle, no sharing"
    return () => {
      alive = false;
    };
  }, []);

  const aiAvailable = !!status?.ai.enabled && !!status.ai.configured;
  const imageGenerationAvailable = !!status?.images.enabled && !!status.images.configured;
  const shareEnabled = !!status?.share.enabled;

  const go = useCallback((next: StudioStage) => {
    userMoved.current = true;
    window.scrollTo({ top: 0 });
    setStage(next);
  }, []);

  const generate = useCallback(async () => {
    const v = validateBrief(values);
    if (!v.ok) {
      setErrors(v.errors);
      const first = FOCUS_ORDER.find((f) => v.errors[f]);
      if (first) requestAnimationFrame(() => document.getElementById(first)?.focus());
      return;
    }
    const runId = ++imageRunId.current;
    setErrors({});
    setBrief(v.brief);
    setShare({ phase: "idle" });
    setPendingImageIds(new Set());
    setImageNotice(null);
    go("generating");

    const mode = aiAvailable && useAi ? "ai" : "demo";
    const run = async (): Promise<Outcome> => {
      try {
        const r = await generateConcepts(v.brief, mode);
        return { concepts: r.concepts, source: r.source, warning: r.warning, retryAfterSeconds: r.retryAfterSeconds };
      } catch {
        // The server is unreachable (or refused us): write sample ideas right here in the browser instead.
        return { concepts: getDemoConcepts(v.brief), source: "demo-fallback", warning: "offline" };
      }
    };
    const [out] = await Promise.all([run(), sleep(reduce ? 0 : 1100)]); // a short pause so the loading state is felt
    if (runId !== imageRunId.current) return;
    setConcepts(out.concepts);
    setOriginals(out.concepts);
    setOutcome({ source: out.source, warning: out.warning, retryAfterSeconds: out.retryAfterSeconds });
    setSelectedId(null);
    go("board");

    if (imageGenerationAvailable) {
      setPendingImageIds(new Set(out.concepts.map((concept) => concept.id)));
      let failed = false;
      await Promise.all(
        out.concepts.map(async (concept) => {
          try {
            const result = await generateConceptImage(v.brief, concept);
            if (imageRunId.current !== runId) return;
            setConcepts((current) => current.map((item) => (item.id === concept.id ? { ...item, imageUrl: result.imageUrl } : item)));
            setOriginals((current) => current.map((item) => (item.id === concept.id ? { ...item, imageUrl: result.imageUrl } : item)));
            setShare({ phase: "idle" });
          } catch {
            if (imageRunId.current === runId) failed = true;
          } finally {
            if (imageRunId.current === runId) {
              setPendingImageIds((current) => {
                const next = new Set(current);
                next.delete(concept.id);
                return next;
              });
            }
          }
        }),
      );
      if (imageRunId.current === runId && failed) {
        setImageNotice("Some images could not be generated. You can retry from an idea’s editor.");
      }
    }
  }, [values, aiAvailable, useAi, reduce, imageGenerationAvailable, go]);

  const updateConcept = (next: Concept) => {
    setConcepts((cs) => cs.map((c) => (c.id === next.id ? next : c)));
    setShare({ phase: "idle" }); // an old link no longer matches the edits
  };

  const resetConcept = (id: string) => {
    const original = originals.find((c) => c.id === id);
    if (!original) return;
    updateConcept(original);
    setResetCount((n) => n + 1);
  };

  const save = async () => {
    if (!brief) return;
    if (pendingImageIds.size > 0) {
      setShare({ phase: "error", message: "Wait for the images to finish before saving this link." });
      return;
    }
    const check = shareSchema.safeParse({ brief, concepts, selectedId: selectedId ?? undefined });
    if (!check.success) {
      setShare({ phase: "error", message: SHARE_ERRORS.invalid_request });
      return;
    }
    setShare({ phase: "saving" });
    try {
      const r = await saveShare(check.data);
      setShare({ phase: "done", url: `${window.location.origin}${r.path}` });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setShare({ phase: "error", message: SHARE_ERRORS[code] ?? "We couldn’t save the link. Please try again." });
    }
  };

  const focusHeading = () => {
    if (userMoved.current) headingRef.current?.focus({ preventScroll: true });
  };

  const selected = concepts.find((c) => c.id === selectedId) ?? null;
  const selectedIndex = selected ? concepts.indexOf(selected) : 0;
  const notice = outcome ? describeResult(outcome.source, outcome.warning, outcome.retryAfterSeconds) : null;
  const view = stage === "generating" ? "board" : stage;

  return (
    <div className="min-h-svh bg-paper">
      <StudioHeader stage={stage} />
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            // Even with reduced motion the exit must change something (instantly), or AnimatePresence never finishes leaving.
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            onAnimationComplete={focusHeading}
          >
            {view === "brief" && (
              <div className="grid gap-16 lg:grid-cols-12">
                <section aria-labelledby="brief-title" className="lg:col-span-8">
                  <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">FIG. 00 / Brief</p>
                  <h1 id="brief-title" ref={headingRef} tabIndex={-1} className="mt-5 mb-12 max-w-3xl font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.94] tracking-[-0.03em] text-ink outline-none">
                    Tell us about your <em className="text-coral">product.</em>
                  </h1>
                  {imageGenerationAvailable && (
                    <p className="mb-8 border-l border-leaf pl-4 font-display text-sm italic text-ink/65">
                      Creating a new set also generates three AI image concepts. They appear as they finish.
                    </p>
                  )}
                  <BriefForm
                    values={values}
                    errors={errors}
                    onChange={(v) => {
                      setValues(v);
                      if (Object.keys(errors).length) setErrors({});
                    }}
                    onSubmit={generate}
                    onLoadDemo={() => {
                      setValues(toValues(DEMO_BRIEF));
                      setErrors({});
                    }}
                    aiAvailable={aiAvailable}
                    useAi={useAi}
                    onUseAi={setUseAi}
                    busy={stage === "generating"}
                  />
                </section>
                <aside className="hidden lg:col-span-4 lg:block" aria-label="What you will get">
                  <div className="sticky top-6"><SpecimenCard values={values} /><ol className="mt-8 space-y-3 text-sm text-ink/65"><li>01 / Three ad ideas</li><li>02 / Live platform previews</li><li>03 / A shareable link</li></ol></div>
                </aside>
              </div>
            )}

            {view === "board" && brief && (
              <ResultsBoard
                brief={brief}
                concepts={concepts}
                pendingImageIds={pendingImageIds}
                imageGenerationAvailable={imageGenerationAvailable}
                imageNotice={imageNotice}
                loading={stage === "generating"}
                source={outcome?.source ?? null}
                notice={notice}
                headingRef={headingRef}
                onEdit={(id) => {
                  setSelectedId(id);
                  go("editor");
                }}
                onRegenerate={generate}
                onBackToBrief={() => go("brief")}
              />
            )}

            {view === "editor" && brief && selected && (
              <ConceptEditor
                key={`${selected.id}-${resetCount}`}
                brief={brief}
                concept={selected}
                index={selectedIndex}
                tab={tab}
                onTab={setTab}
                onChange={updateConcept}
                imageGenerationAvailable={imageGenerationAvailable}
                imagePending={pendingImageIds.has(selected.id)}
                onImageReady={(imageUrl) => {
                  setConcepts((cs) => cs.map((c) => (c.id === selected.id ? { ...c, imageUrl } : c)));
                  setShare({ phase: "idle" });
                }}
                onReset={() => resetConcept(selected.id)}
                onBack={() => go("board")}
                headingRef={headingRef}
                slot={<ShareBar enabled={shareEnabled} state={share} onSave={save} />}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
