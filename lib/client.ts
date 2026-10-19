import type {
  BriefInput,
  GenerateResponse,
  Concept,
  SharePayload,
  StatusResponse,
} from "./schemas";

/** Typed fetch helpers for the UI (works in client components and server components alike). */
export class ApiError extends Error {
  constructor(public status: number, public code: string, public issues?: { path: string; message: string }[]) {
    super(code);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(res.status, String(data.error ?? "request_failed"), data.issues as ApiError["issues"]);
  }
  return data as T;
}

export const getStatus = () => request<StatusResponse>("/api/status");

/** mode "demo" is instant and free; "ai" falls back to demo automatically (check `source` / `warning`). */
export const generateConcepts = (brief: BriefInput, mode: "demo" | "ai" = "demo") =>
  request<GenerateResponse>("/api/generate", { method: "POST", body: JSON.stringify({ brief, mode }) });

export const generateConceptImage = (brief: BriefInput, concept: Concept) =>
  request<{ imageUrl: string }>("/api/image", { method: "POST", body: JSON.stringify({ brief, concept }) });

export const saveShare = (payload: SharePayload) =>
  request<{ id: string; path: string }>("/api/share", { method: "POST", body: JSON.stringify(payload) });

export const loadShare = (id: string) => request<SharePayload>(`/api/share/${encodeURIComponent(id)}`);
