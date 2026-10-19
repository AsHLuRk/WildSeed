import { briefSchema, type Brief, type Goal, type Tone } from "@/lib/schemas";

/** The form's own shape: everything is a plain string or list, so inputs stay controlled. */
export type BriefValues = {
  productName: string;
  audience: string;
  goal: Goal;
  tones: Tone[];
  brandColor: string;
  description: string;
};

export type BriefField = "productName" | "audience" | "goal" | "tones" | "brandColor" | "description";
export type BriefErrors = Partial<Record<BriefField, string>>;

export const EMPTY_VALUES: BriefValues = {
  productName: "",
  audience: "",
  goal: "sales",
  tones: ["premium"],
  brandColor: "#F0674E",
  description: "",
};

export const toValues = (b: Brief): BriefValues => ({
  productName: b.productName,
  audience: b.audience,
  goal: b.goal,
  tones: b.tones,
  brandColor: b.brandColor,
  description: b.description ?? "",
});

const REQUIRED: Record<BriefField, string> = {
  productName: "Add your product or brand name.",
  audience: "Say who this is for.",
  goal: "Pick a goal.",
  tones: "Choose at least one tone.",
  brandColor: "Use a colour like #F0674E.",
  description: "Check this field.",
};

const MAX: Partial<Record<BriefField, number>> = { productName: 80, audience: 160, description: 400, tones: 4 };

export function validateBrief(values: BriefValues): { ok: true; brief: Brief } | { ok: false; errors: BriefErrors } {
  const result = briefSchema.safeParse({
    ...values,
    description: values.description.trim() || undefined,
  });
  if (result.success) return { ok: true, brief: result.data };

  const errors: BriefErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as BriefField | undefined;
    if (!field || !(field in REQUIRED) || errors[field]) continue;
    errors[field] = issue.code === "too_big" && MAX[field] ? `Keep this under ${MAX[field]} characters.` : REQUIRED[field];
  }
  return { ok: false, errors };
}
