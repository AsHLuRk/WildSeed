"use client";

import { useState } from "react";

export type ShareUi =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "done"; url: string }
  | { phase: "error"; message: string };

type Props = {
  enabled: boolean;
  state: ShareUi;
  onSave: () => void;
};

export default function ShareBar({ enabled, state, onSave }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the link is selectable in the box below, so nothing is lost */
    }
  };

  return (
    <div className="mt-8 border-y border-line py-5 print:hidden" data-testid="share-bar">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-5">
          <div>
          <p className="font-medium text-ink">Share these ideas</p>
          <p className="text-sm text-ink/75">
            {enabled
              ? "Save a link with your edits."
              : "Sharing needs the Supabase setup, so it’s switched off on this site."}
          </p>
          </div>
          <span aria-hidden="true" className="hidden h-10 border-l border-dashed border-ink/35 sm:block" />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={!enabled || state.phase === "saving"}
          className={`${state.phase === "done" ? "group/link relative min-h-11 px-0 text-sm font-medium text-ink" : "group/primary rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink"} transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {state.phase === "saving" ? "Saving…" : state.phase === "done" ? "Save again" : "Save and get link"}
          {state.phase === "done" ? <span aria-hidden="true" className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/link:scale-x-100" /> : <span aria-hidden="true" className="ml-3 inline-block transition-transform duration-300 group-hover/primary:translate-x-1">-&gt;</span>}
        </button>
      </div>

      <div aria-live="polite">
        {state.phase === "done" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 opacity-100 transition-opacity duration-300">
            <input
              readOnly
              aria-label="Share link"
              value={state.url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 border-0 border-b border-ink/35 bg-transparent px-0 py-2.5 font-mono text-sm text-ink outline-none focus:border-leaf focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            />
            <button type="button" onClick={() => copy(state.url)} className="group/link relative min-h-11 px-0 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              {copied ? "✓ Copied" : "Copy link"}
              <span aria-hidden="true" className="absolute right-0 bottom-1 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/link:scale-x-100" />
            </button>
            <a href={state.url} target="_blank" rel="noopener noreferrer" className="group/link relative flex min-h-11 items-center gap-2 px-0 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Open <span aria-hidden="true" className="transition-transform duration-300 group-hover/link:translate-x-1">-&gt;</span>
              <span aria-hidden="true" className="absolute right-0 bottom-1 left-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover/link:scale-x-100" />
            </a>
            <svg aria-hidden="true" viewBox="0 0 100 38" className="ml-auto h-10 w-24 -rotate-4 text-leaf"><path d="M8 27c16 7 68 7 84-1M10 10c18-6 63-5 80 1M14 6c-3 8-4 16-1 23M85 7c4 8 3 15 0 23" fill="none" stroke="currentColor" strokeWidth="1.2" /><text x="28" y="23" fill="currentColor" fontSize="11" fontStyle="italic">Saved</text></svg>
          </div>
        )}
        {state.phase === "error" && (
          <p role="alert" className="mt-4 flex items-start gap-2 border-l-2 border-coral pl-3 text-sm font-medium text-ink">
            <span aria-hidden="true" className="mt-1 text-coral">!</span>
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
