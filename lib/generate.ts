import { extractJson, callLlm, unwrapConcepts, type LlmConfig } from "./llm";
import { buildPrompt } from "./prompt";
import { modelConceptsSchema, formatIssues, type Brief, type Concept } from "./schemas";

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

/**
 * Ask the model for 3 concepts, validate strictly, retry ONCE with the
 * validation problem fed back. Transport errors (timeout / HTTP) are not
 * retried — they throw immediately so the caller can fall back to demo mode.
 */
export async function generateWithAi(cfg: LlmConfig, brief: Brief): Promise<Concept[]> {
  let hint: string | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await callLlm(cfg, buildPrompt(brief, hint));

    let parsed: unknown;
    try {
      parsed = unwrapConcepts(extractJson(reply));
    } catch {
      hint = "it was not valid JSON";
      continue;
    }

    const result = modelConceptsSchema.safeParse(parsed);
    if (result.success) {
      return result.data.map((c, i) => ({ ...c, id: `c${i + 1}` }));
    }
    hint = formatIssues(result.error)
      .map((i) => `${i.path || "root"}: ${i.message}`)
      .join("; ");
  }

  throw new GenerationError("model output failed validation twice");
}
