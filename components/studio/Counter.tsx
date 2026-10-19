import { counterHint, type CounterRow } from "@/lib/studio/limits";

const STYLE = {
  ok: "border-[#3f6b3e]/40 text-[#3f6b3e]",
  warn: "border-[#b7791f]/60 text-[#8a5a12]",
  over: "border-coral bg-coral/10 font-medium text-[#b3361f]",
} as const;

const WORD = { ok: "ok", warn: "close", over: "over" } as const;

const LABELS: Record<string, string> = {
  "google-headline": "Google headline",
  "linkedin-headline": "LinkedIn headline",
  "google-description": "Google description",
  "linkedin-intro": "LinkedIn intro",
  "instagram-caption": "Instagram caption (headline and text)",
};

export default function CounterPill({ row, activePlatform }: { row: CounterRow; activePlatform?: string }) {
  const percentage = Math.min(row.length / row.max, 1);
  const label = LABELS[row.id] ?? `${row.platform} field`;
  const active = activePlatform && row.id.startsWith(activePlatform);
  const explanation = row.status === "over"
    ? `${label} will be cut after ${row.max} characters.`
    : row.status === "warn" && row.recommended
      ? "Past the recommended length: the rest may be hidden behind “more”."
      : undefined;
  return (
    <div className="space-y-1.5" title={counterHint(row)}>
      <div className="flex items-center gap-2 text-xs text-ink/75">
        {active && <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-leaf" />}
        <span className="min-w-0 flex-1">{label}{active && <span className="ml-2 text-[10px] tracking-[0.14em] text-leaf uppercase">In preview</span>}</span>
        <span className="tabular-nums text-ink">{row.length}/{row.shown}</span>
        <span className={`font-medium ${STYLE[row.status]}`}>{WORD[row.status]}</span>
      </div>
      <div role="meter" aria-valuemin={0} aria-valuemax={row.max} aria-valuenow={Math.min(row.length, row.max)} aria-label={`${label}: ${row.length} of ${row.max} characters`} className="relative h-1 bg-line">
        <span className={`absolute inset-y-0 left-0 origin-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${row.status === "over" ? "bg-coral" : row.status === "warn" ? "bg-[#B7791F]" : "bg-leaf"}`} style={{ transform: `scaleX(${percentage})` }} />
        {row.recommended && <span aria-hidden="true" className="absolute inset-y-[-2px] w-px bg-ink/45" style={{ left: `${Math.min(row.recommended / row.max, 1) * 100}%` }} />}
        <span aria-hidden="true" className="absolute inset-y-[-2px] right-0 w-px bg-ink/70" />
      </div>
      <span className="sr-only">{WORD[row.status]}</span>
      {explanation && <p className="text-xs leading-5 text-ink/70">{explanation}</p>}
    </div>
  );
}
