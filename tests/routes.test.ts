import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// connection() only works inside a real Next.js request; the live-server smoke test covers that path.
vi.mock("next/server", () => ({ connection: async () => {} }));

import { POST as generate } from "@/app/api/generate/route";
import { GET as status } from "@/app/api/status/route";
import { POST as shareCreate } from "@/app/api/share/route";
import { GET as shareGet } from "@/app/api/share/[id]/route";
import { DEMO_BRIEF, getDemoConcepts } from "@/lib/sampleConcepts";
import { _resetMemoryLimiter } from "@/lib/rateLimit";

const BRIEF = { productName: "Kiln & Co.", audience: "coffee lovers", goal: "sales", tones: ["premium"] };

const post = (body: unknown, headers: Record<string, string> = {}, path = "/api/generate") =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const validModelConcepts = () =>
  getDemoConcepts(DEMO_BRIEF).map(({ id: _id, ...c }) => ({ ...c, headline: "AI " + c.headline }));

const geminiReply = (text: string) =>
  Response.json({ candidates: [{ content: { parts: [{ text }] } }] });

function enableAi(extra: Record<string, string> = {}) {
  vi.stubEnv("ENABLE_AI", "true");
  vi.stubEnv("LLM_PROVIDER", "gemini");
  vi.stubEnv("LLM_API_KEY", "secret-test-key");
  vi.stubEnv("LLM_MODEL", "test-model");
  for (const [k, v] of Object.entries(extra)) vi.stubEnv(k, v);
}

beforeEach(() => {
  _resetMemoryLimiter();
  for (const k of ["ENABLE_AI", "LLM_API_KEY", "GEMINI_API_KEY", "LLM_PROVIDER", "LLM_BASE_URL", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "AI_RATE_LIMIT", "AI_DAILY_CAP"]) {
    vi.stubEnv(k, "");
  }
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/generate", () => {
  it("demo mode returns demo concepts and never calls the network", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const res = await generate(post({ brief: BRIEF }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.source).toBe("demo");
    expect(data.concepts).toHaveLength(3);
    expect(f).not.toHaveBeenCalled();
  });

  it("rejects bad JSON, invalid briefs, oversized bodies and foreign origins", async () => {
    expect((await generate(post("{nope"))).status).toBe(400);

    const invalid = await generate(post({ brief: { ...BRIEF, goal: "x" } }));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).issues[0].path).toBe("brief.goal");

    expect((await generate(post({ brief: { ...BRIEF, description: "z".repeat(20000) } }))).status).toBe(413);
    expect((await generate(post({ brief: BRIEF }, { origin: "https://evil.example.org" }))).status).toBe(403);
  });

  it("mode=ai with AI disabled or unconfigured falls back to demo with a warning", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    let data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data).toMatchObject({ source: "demo-fallback", warning: "ai_disabled" });

    vi.stubEnv("ENABLE_AI", "true");
    data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data).toMatchObject({ source: "demo-fallback", warning: "ai_not_configured" });
    expect(f).not.toHaveBeenCalled();
  });

  it("mode=ai (gemini) returns validated AI concepts with ids, and never leaks the key", async () => {
    enableAi();
    const f = vi.fn().mockResolvedValue(geminiReply(JSON.stringify(validModelConcepts())));
    vi.stubGlobal("fetch", f);

    const res = await generate(post({ brief: BRIEF, mode: "ai" }));
    const text = await res.text();
    const data = JSON.parse(text);

    expect(data.source).toBe("ai");
    expect(data.concepts.map((c: { id: string }) => c.id)).toEqual(["c1", "c2", "c3"]);
    expect(data.concepts[0].headline.startsWith("AI ")).toBe(true);
    expect(text).not.toContain("secret-test-key");

    const [url, init] = f.mock.calls[0];
    expect(String(url)).toContain("generativelanguage.googleapis.com");
    expect(String(url)).toContain("test-model");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("secret-test-key");
    expect(JSON.parse(init.body).generationConfig.responseMimeType).toBe("application/json");
  });

  it("supports openai-compatible providers (DeepSeek / Kimi / OpenRouter style)", async () => {
    enableAi({ LLM_PROVIDER: "openai-compatible", LLM_BASE_URL: "https://api.example.com/v1/", LLM_MODEL: "some-model" });
    const body = { choices: [{ message: { content: "```json\n" + JSON.stringify(validModelConcepts()) + "\n```" } }] };
    const f = vi.fn().mockResolvedValue(Response.json(body));
    vi.stubGlobal("fetch", f);

    const data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data.source).toBe("ai");
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toBe("https://api.example.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-test-key");
  });

  it("accepts { concepts: [...] } wrapped output", async () => {
    enableAi();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiReply(JSON.stringify({ concepts: validModelConcepts() }))));
    const data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data.source).toBe("ai");
  });

  it("retries once on malformed output, then succeeds", async () => {
    enableAi();
    const f = vi
      .fn()
      .mockResolvedValueOnce(geminiReply("Sorry, here is some prose instead of JSON"))
      .mockResolvedValueOnce(geminiReply(JSON.stringify(validModelConcepts())));
    vi.stubGlobal("fetch", f);
    const data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data.source).toBe("ai");
    expect(f).toHaveBeenCalledTimes(2);
    expect(JSON.parse(f.mock.calls[1][1].body).contents[0].parts[0].text).toMatch(/previous reply was rejected/);
  });

  it("falls back to demo after two invalid replies (wrong count / schema)", async () => {
    enableAi();
    // fresh Response per call: a body can only be read once
    const f = vi.fn().mockImplementation(async () => geminiReply(JSON.stringify(validModelConcepts().slice(0, 2))));
    vi.stubGlobal("fetch", f);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data).toMatchObject({ source: "demo-fallback", warning: "ai_failed" });
    expect(data.concepts).toHaveLength(3);
    expect(f).toHaveBeenCalledTimes(2);
    // proves we went through the validation path, not a transport error
    expect(String(errSpy.mock.calls[0][1])).toMatch(/GenerationError: model output failed validation twice/);
  });

  it("falls back immediately (no retry) on HTTP errors and timeouts", async () => {
    enableAi();
    const f = vi.fn().mockResolvedValue(new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", f);
    vi.spyOn(console, "error").mockImplementation(() => {});
    let data = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(data).toMatchObject({ source: "demo-fallback", warning: "ai_failed" });
    expect(f).toHaveBeenCalledTimes(1);

    enableAi({ LLM_TIMEOUT_MS: "20" });
    const slow = vi.fn((_u: unknown, init: RequestInit) =>
      new Promise((_r, reject) => {
        init.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
      }),
    );
    vi.stubGlobal("fetch", slow);
    data = await (await generate(post({ brief: BRIEF, mode: "ai" }, { "x-forwarded-for": "8.8.8.8" }))).json();
    expect(data).toMatchObject({ source: "demo-fallback", warning: "ai_failed" });
    expect(slow).toHaveBeenCalledTimes(1);
  });

  it("per-IP rate limit sends later AI requests to demo-fallback with Retry-After", async () => {
    enableAi({ AI_RATE_LIMIT: "1" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => geminiReply(JSON.stringify(validModelConcepts()))));

    const first = await (await generate(post({ brief: BRIEF, mode: "ai" }))).json();
    expect(first.source).toBe("ai");

    const secondRes = await generate(post({ brief: BRIEF, mode: "ai" }));
    const second = await secondRes.json();
    expect(second).toMatchObject({ source: "demo-fallback", warning: "rate_limited" });
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
    expect(secondRes.headers.get("Retry-After")).toBeTruthy();

    // a different visitor is unaffected
    const other = await (await generate(post({ brief: BRIEF, mode: "ai" }, { "x-forwarded-for": "7.7.7.7" }))).json();
    expect(other.source).toBe("ai");
  });

  it("daily cap protects the free quota across all visitors", async () => {
    enableAi({ AI_DAILY_CAP: "1" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => geminiReply(JSON.stringify(validModelConcepts()))));
    expect((await (await generate(post({ brief: BRIEF, mode: "ai" }))).json()).source).toBe("ai");
    const second = await (await generate(post({ brief: BRIEF, mode: "ai" }, { "x-forwarded-for": "6.6.6.6" }))).json();
    expect(second).toMatchObject({ source: "demo-fallback", warning: "daily_cap_reached" });
  });
});

describe("GET /api/status", () => {
  it("reports capabilities without secrets", async () => {
    let data = await (await status()).json();
    expect(data).toEqual({ ai: { enabled: false, configured: false }, share: { enabled: false }, rateLimit: { backend: "memory" } });

    enableAi();
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc-secret");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://u.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tok");
    const res = await status();
    const text = await res.text();
    data = JSON.parse(text);
    expect(data).toEqual({ ai: { enabled: true, configured: true }, share: { enabled: true }, rateLimit: { backend: "upstash" } });
    expect(text).not.toMatch(/secret|svc|tok/);
  });
});

describe("share routes", () => {
  const SHARE = { brief: BRIEF, concepts: getDemoConcepts(DEMO_BRIEF), selectedId: "c1" };

  it("returns 501 when Supabase isn't configured", async () => {
    expect((await shareCreate(post(SHARE, {}, "/api/share"))).status).toBe(501);
    const res = await shareGet(new Request("http://localhost/api/share/abcdefgh1234"), { params: Promise.resolve({ id: "abcdefgh1234" }) });
    expect(res.status).toBe(501);
  });

  it("saves a share (validated) and reads it back; rejects bad ids and unknown ids", async () => {
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc-secret");

    let stored: unknown = null;
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      if (init?.method === "POST") {
        stored = JSON.parse(String(init.body));
        return new Response(null, { status: 201 });
      }
      return Response.json(u.includes("id=eq.known") ? [{ payload: SHARE }] : []);
    });
    vi.stubGlobal("fetch", f);

    const res = await shareCreate(post(SHARE, {}, "/api/share"));
    const created = await res.json();
    expect(res.status).toBe(201);
    expect(created.id).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(created.path).toBe(`/share/${created.id}`);
    expect((stored as { id: string }).id).toBe(created.id);
    const [insertUrl, insertInit] = f.mock.calls[0];
    expect(String(insertUrl)).toBe("https://x.supabase.co/rest/v1/shares");
    expect((insertInit!.headers as Record<string, string>).apikey).toBe("svc-secret");

    expect((await shareCreate(post({ brief: BRIEF, concepts: [] }, {}, "/api/share"))).status).toBe(400);

    const bad = await shareGet(new Request("http://localhost/api/share/x"), { params: Promise.resolve({ id: "../etc" }) });
    expect(bad.status).toBe(400);

    const missing = await shareGet(new Request("http://localhost/api/share/nope"), { params: Promise.resolve({ id: "unknown12345" }) });
    expect(missing.status).toBe(404);

    const found = await shareGet(new Request("http://localhost/api/share/known"), { params: Promise.resolve({ id: "known1234567" }) });
    expect(found.status).toBe(200);
    expect((await found.json()).selectedId).toBe("c1");
  });

  it("returns 502 (not a crash) when Supabase fails", async () => {
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("err", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await shareCreate(post(SHARE, {}, "/api/share"))).status).toBe(502);
  });
});
