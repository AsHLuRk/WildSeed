"use client";

import { GOALS, TONES, type Goal, type Tone } from "@/lib/types";
import type { BriefErrors, BriefValues } from "@/lib/studio/validation";

type Props = {
  values: BriefValues;
  errors: BriefErrors;
  onChange: (v: BriefValues) => void;
  onSubmit: () => void;
  onLoadDemo: () => void;
  aiAvailable: boolean;
  useAi: boolean;
  onUseAi: (on: boolean) => void;
  busy: boolean;
};

const GOAL_COPY: Record<Goal, { title: string; hint: string }> = {
  awareness: { title: "Awareness", hint: "Get noticed" },
  traffic: { title: "Traffic", hint: "Send visits" },
  leads: { title: "Leads", hint: "Collect enquiries" },
  sales: { title: "Sales", hint: "Drive purchases" },
};
const TONE_COPY: Record<Tone, string> = { bold: "Bold", playful: "Playful", premium: "Premium", minimal: "Minimal" };
const SWATCHES = ["#F0674E", "#5B8C5A", "#3E7C7B", "#E3A72F", "#7A4E6D", "#1F2A24"];
const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

const input =
  "w-full border-0 border-b border-ink/35 bg-transparent px-0 py-3 font-display text-[1.75rem] text-ink outline-none placeholder:italic placeholder:text-ink/35 focus:border-leaf focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf aria-[invalid=true]:border-coral";

function Field({ id, label, hint, error, count, max, children }: { id: string; label: string; hint?: string; error?: string; count?: number; max?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[11px] tracking-[0.18em] text-ink/60 uppercase">
          {label}
        </label>
        {max !== undefined && (
          <span className="text-xs text-ink/50 tabular-nums" aria-hidden="true">
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-[#b3361f]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function BriefForm({ values, errors, onChange, onSubmit, onLoadDemo, aiAvailable, useAi, onUseAi, busy }: Props) {
  const set = <K extends keyof BriefValues>(key: K, v: BriefValues[K]) => onChange({ ...values, [key]: v });
  const toggleTone = (t: Tone) =>
    set("tones", values.tones.includes(t) ? values.tones.filter((x) => x !== t) : [...values.tones, t].slice(0, 4));
  const describedBy = (id: string, error?: string, hint?: boolean) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[17px] leading-[1.65] text-ink/70">A short brief gives the ideas somewhere to start. You can edit every word before sharing.</p>
        <button
          type="button"
          onClick={onLoadDemo}
          className="rounded-full border border-ink/30 bg-card px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
          Load demo brief
        </button>
      </div>

      <Field id="productName" label="Product or brand name" error={errors.productName} count={values.productName.length} max={80}>
        <input
          id="productName"
          className={input}
          value={values.productName}
          maxLength={80}
          placeholder="e.g. Kiln & Co."
          aria-invalid={!!errors.productName}
          aria-describedby={describedBy("productName", errors.productName)}
          onChange={(e) => set("productName", e.target.value)}
        />
      </Field>

      <Field id="audience" label="Who is it for?" error={errors.audience} count={values.audience.length} max={160}>
        <input
          id="audience"
          className={input}
          value={values.audience}
          maxLength={160}
          placeholder="e.g. design-loving coffee drinkers"
          aria-invalid={!!errors.audience}
          aria-describedby={describedBy("audience", errors.audience)}
          onChange={(e) => set("audience", e.target.value)}
        />
      </Field>

      <Field id="description" label="Anything else we should know? (optional)" error={errors.description} count={values.description.length} max={400} hint="Materials, price range, what makes it different. We only use what you write here.">
        <textarea
          id="description"
          rows={3}
          className={input}
          value={values.description}
          maxLength={400}
          aria-invalid={!!errors.description}
          aria-describedby={describedBy("description", errors.description, true)}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <fieldset aria-describedby={errors.goal ? "goal-error" : undefined}>
        <legend className="mb-3 text-[11px] tracking-[0.18em] text-ink/60 uppercase">What’s the goal?</legend>
        <div className="relative grid grid-cols-2 border-y border-line md:grid-cols-4">
          {GOALS.map((g) => (
            <label
              key={g}
              className={`cursor-pointer border-r border-line p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-leaf ${values.goal === g ? "bg-card" : "hover:bg-card/60"}`}
            >
              <input type="radio" name="goal" value={g} checked={values.goal === g} onChange={() => set("goal", g)} className="sr-only" />
              <span className="block font-display text-xl text-ink">{GOAL_COPY[g].title}</span>
              <span className="mt-0.5 block text-sm text-ink/60">{GOAL_COPY[g].hint}</span>
            </label>
          ))}
        </div>
        {errors.goal && (
          <p id="goal-error" role="alert" className="mt-1.5 text-sm font-medium text-[#b3361f]">
            {errors.goal}
          </p>
        )}
      </fieldset>

      <fieldset aria-describedby={errors.tones ? "tones-error" : "tones-hint"}>
        <legend className="mb-3 text-[11px] tracking-[0.18em] text-ink/60 uppercase">Tone of voice</legend>
        <div className="flex flex-wrap gap-5 border-b border-line pb-4">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={values.tones.includes(t)}
              onClick={() => toggleTone(t)}
              className={`border-b px-1 py-2 text-sm transition-colors ${values.tones.includes(t) ? "border-ink text-ink" : "border-transparent text-ink/60 hover:border-leaf"}`}
            >
              {TONE_COPY[t]}
            </button>
          ))}
        </div>
        {errors.tones ? (
          <p id="tones-error" role="alert" className="mt-1.5 text-sm font-medium text-[#b3361f]">
            {errors.tones}
          </p>
        ) : (
          <p id="tones-hint" className="mt-1.5 text-sm text-ink/60">
            Choose up to four. The first one leads.
          </p>
        )}
      </fieldset>

      <Field id="brandColor" label="Brand colour" error={errors.brandColor}>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="color"
            aria-label="Pick a brand colour"
            value={isHex(values.brandColor) ? values.brandColor : "#F0674E"}
            onChange={(e) => set("brandColor", e.target.value.toUpperCase())}
            className="h-8 w-8 cursor-pointer rounded-full border border-line bg-card p-0"
          />
          <input
            id="brandColor"
            className="max-w-[10rem] border-b border-ink/35 bg-transparent px-0 py-2 font-mono text-sm outline-none focus:border-leaf"
            value={values.brandColor}
            maxLength={7}
            aria-invalid={!!errors.brandColor}
            aria-describedby={describedBy("brandColor", errors.brandColor)}
            onChange={(e) => set("brandColor", e.target.value)}
          />
          <div className="flex gap-2" role="group" aria-label="Quick colours">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                aria-pressed={values.brandColor.toUpperCase() === c}
                onClick={() => set("brandColor", c)}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${values.brandColor.toUpperCase() === c ? "border-ink" : "border-transparent ring-1 ring-line"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </Field>

      <div className="sticky bottom-0 z-20 -mx-5 flex flex-wrap items-center justify-between gap-4 border-t border-line bg-paper/95 px-5 py-5 backdrop-blur-sm md:static md:mx-0 md:px-0">
        {aiAvailable ? (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={useAi} onChange={(e) => onUseAi(e.target.checked)} className="peer sr-only" />
            <span className="text-[11px] tracking-[0.15em] text-ink/65 uppercase">Writing mode</span>
            <span aria-hidden="true" className="relative flex h-9 w-[8.5rem] items-center border border-ink/30 bg-paper p-0.5 text-xs font-medium shadow-sm after:absolute after:inset-y-0.5 after:left-0.5 after:w-16 after:bg-ink after:transition-transform peer-checked:after:translate-x-[4.25rem]" />
            <span className="pointer-events-none relative -ml-[8rem] flex w-[8rem] justify-between px-3 text-xs"><span className="text-paper peer-checked:text-ink">Sample</span><span className="text-ink peer-checked:text-paper">AI</span></span>
          </label>
        ) : (
          <p className="text-sm text-ink/60">Sample mode: instant ideas, no AI needed.</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="group rounded-full bg-coral px-8 py-3.5 text-base font-medium text-ink transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-60"
        >
          <span>{aiAvailable && useAi ? "Generate with AI" : "Generate ideas"}</span><span aria-hidden="true" className="ml-3 inline-block transition-transform group-hover:translate-x-1">-&gt;</span>
        </button>
      </div>
    </form>
  );
}
