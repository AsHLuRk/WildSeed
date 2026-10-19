# Emberlane Studio — backend module

Everything that isn't UI: validation, the AI route with demo fallback, rate limiting,
share links, platform limits, and tests. Drop it into any **Next.js App Router** project
(built and tested on Next 16.4, Zod 4, Vitest 5, Node 22).

```
app/api/generate/route.ts      POST  brief -> 3 ad concepts (demo | AI, always falls back to demo)
app/api/status/route.ts        GET   what's configured (AI? images? share? limiter?) — no secrets
app/api/share/route.ts         POST  save concepts, returns { id, path }       (needs Supabase)
app/api/share/[id]/route.ts    GET   load a saved share                         (needs Supabase)
app/api/image/route.ts         POST  generate/store a brief-aware image        (Cloudflare + Supabase Storage)
app/api/generated-images/[id]  GET   serve a stored image to previews/shares
lib/schemas.ts                 Zod schemas + all shared types (single source of truth)
lib/types.ts                   import types from here in the UI
lib/platforms.ts               per-platform char limits, charStatus(), truncateAtWord(), toPlatformCopy()
lib/sampleConcepts.ts          DEMO_BRIEF + getDemoConcepts() (demo mode + fallback)
lib/client.ts                  typed fetch helpers for the UI
lib/prompt.ts / llm.ts / generate.ts    prompt, Gemini + OpenAI-compatible client, strict-JSON retry
lib/rateLimit.ts               per-IP + daily cap; Upstash if configured, memory otherwise
lib/http.ts / env.ts / supabase.ts      helpers
supabase/schema.sql            table for share links (run once)
supabase/generated-images.sql  private bucket for generated image files (run once)
tests/                         30 tests
.env.example                   every env var, documented
```

## Install

1. Copy `lib/`, `app/api/`, `supabase/`, `tests/`, `vitest.config.mts`, `.env.example` into your project root
   (next to `app/`). Imports use the `@/` alias, which `create-next-app` sets up by default.
   If your project uses a `src/` folder, copy `lib/` and `app/` into `src/` instead.
2. `npm i zod`
3. Optional, for the tests: `npm i -D vitest` (needs `@types/node` ≥ 22; run `npm i -D @types/node@^22` if npm complains), add `"test": "vitest run"` to `package.json` scripts, then `npm test`.
   If you skip the tests, delete the `tests/` folder so TypeScript doesn't look for Vitest.
4. `cp .env.example .env.local` and fill in what you need (see below).

## What the UI needs to know

```ts
import { generateConcepts, getStatus, saveShare, loadShare } from "@/lib/client";
import { DEMO_BRIEF } from "@/lib/sampleConcepts";
import { PLATFORMS, charStatus, toPlatformCopy } from "@/lib/platforms";
import type { Concept, Brief } from "@/lib/types";
```

**`POST /api/generate`** — body `{ brief, mode: "demo" | "ai" }` (`mode` defaults to `"demo"`)

```jsonc
// brief
{ "productName": "Kiln & Co.", "audience": "design-loving coffee drinkers",
  "goal": "awareness|traffic|leads|sales", "tones": ["bold|playful|premium|minimal"],
  "brandColor": "#FF5A1F", "description": "optional, max 400 chars" }

// response (always 200 for valid input — it never breaks the UI)
{ "source": "ai" | "demo" | "demo-fallback",
  "warning": "ai_disabled|ai_not_configured|rate_limited|daily_cap_reached|ai_failed",  // only on demo-fallback
  "retryAfterSeconds": 3600,                                                           // only on rate_limited
  "concepts": [{ "id": "c1", "headline": "", "body": "", "cta": "", "hashtags": [], "visualDirection": "" }] }
```

Errors for *invalid* input only: `400 invalid_request` (with `issues[]`), `400 invalid_json`, `413 payload_too_large`, `403 forbidden_origin`.

**UI rules:** default to `mode: "demo"`; show a "Generate with AI" toggle only when `getStatus().ai.enabled && .configured`;
if `source` is `demo-fallback`, show a small note ("Showing sample ideas — AI is unavailable right now") instead of an error.

## Behaviour you can rely on

| Situation | Result |
|---|---|
| `mode: "demo"` | instant sample ad copy with no text-model request; optional image calls are separate |
| AI off / no key / over per-IP limit / over daily cap | `demo-fallback` + the matching `warning` |
| Model returns bad JSON or wrong shape | retried once with the problem fed back, then `demo-fallback` |
| Model timeout or HTTP error | `demo-fallback` immediately (no retry) |
| Brief contains "ignore previous instructions…" | treated as data; output still schema-validated |
| Upstash down | falls back to the in-memory limiter (still limiting, never unlimited) |

## What I need from you (nothing here is guessed or faked)

| Item | Why | Where it goes |
|---|---|---|
| **LLM API key** (Gemini via Google AI Studio, or DeepSeek/Kimi/OpenRouter) | real AI generation | `LLM_API_KEY` in `.env.local` **and** Vercel env vars. Then set `ENABLE_AI=true` |
| **Current model id** | the default `gemini-2.5-flash` may be out of date | `LLM_MODEL` — copy the id from your provider's docs/dashboard |
| **Provider base URL** (only if not Gemini) | OpenAI-compatible providers | `LLM_BASE_URL` (no trailing `/chat/completions`) |
| **Supabase project** | share links and generated image storage | create a project → SQL Editor → run `supabase/schema.sql` and `supabase/generated-images.sql` → set Project URL and the **service-role/secret** key in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| **Cloudflare Workers AI token** | generate image concepts | create a token with **Account → Workers AI → Read**; provide `CLOUDFLARE_ACCOUNT_ID` and the raw `CLOUDFLARE_API_TOKEN` (without a `Bearer` prefix) to the server runtime, then set `ENABLE_IMAGE_GENERATION=true` |
| **Upstash Redis** (optional, recommended) | rate-limit counters shared across Vercel instances | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Product images** (`kiln-01..04.webp`) | shared fallback choices in ad previews | `public/assets/ads/` |
| Your **landing page domain** (if different from the app) | cross-origin calls | `ALLOWED_ORIGINS` |

Never prefix any of these with `NEXT_PUBLIC_` and never commit `.env.local`.

## AI-generated product visuals

Set `ENABLE_IMAGE_GENERATION=true`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN` in the server environment. The token needs only **Account → Workers AI → Read**. Run `supabase/generated-images.sql` in the Supabase SQL Editor once; this creates a private bucket that the server uses to keep generated images available in previews and share links.

For local Windows development, the Cloudflare values can stay out of `.env.local`. Enter them in the PowerShell session that starts the app; the token prompt is hidden, and the values remain in that session's environment rather than being written to a file:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = Read-Host "Cloudflare account ID"
$secureToken = Read-Host "Cloudflare API token" -AsSecureString
$env:CLOUDFLARE_API_TOKEN = (New-Object System.Net.NetworkCredential("", $secureToken)).Password
npm run dev
```

After the server starts, `http://localhost:3000/api/status` should report `images.enabled: true` and `images.configured: true`.

When enabled, each new set generates one image for each of its three ideas in the background. An image can also be regenerated from its editor. The API applies a per-IP hourly limit (`IMAGE_RATE_LIMIT`, default 3 image calls) and a total daily limit (`IMAGE_DAILY_CAP`, default 20 image calls). The prompt uses the user's product name/description as factual input, forbids text/logos and unsupported product claims, and limits model-generated visual direction to styling. It cannot guarantee an exact match to a real product; generated visuals are concepts and should be checked before publishing. The model accepts text prompts rather than reference product photos.

## Verification

The Cloudflare image request and Supabase Storage upload need your Cloudflare credentials and the bucket SQL above before they can be exercised end to end. The editor reports a clear error if the provider, quota, or storage bucket is unavailable; it keeps the prior image in that case.

## Known limits

- Platform character limits in `lib/platforms.ts` are values I know of, not live-checked. Verify against current ad specs.
- The in-memory limiter is per serverless instance; add Upstash before sharing the public link widely.
- Share links are public to anyone with the URL and never expire (a cleanup query is in `supabase/schema.sql`).
- The generate route's `maxDuration = 45` and image route's `maxDuration = 60` must fit your hosting plan's limits.
- This module uses `connection()` from `next/server` (Next 15+). No `runtime`/`dynamic` route exports are used
  because Next 16 rejects them when `cacheComponents` is on (the default for new projects).
