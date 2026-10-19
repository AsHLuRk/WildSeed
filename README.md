# Wildseed

Wildseed is a scroll-driven marketing site and AI creative studio built with
Next.js. The landing page turns a seed-to-bloom frame sequence into an
interactive story, while `/studio` lets users turn a product brief into
editable ad concepts and platform previews.

> **Portfolio/demo project:** Wildseed is a fictional studio. Product examples,
> performance numbers, and generated creative are sample content. Review
> generated output before using it in production.

## Highlights

- Scroll-scrubbed seed-to-bloom landing animation with responsive desktop and
  mobile frame sequences.
- Reduced-motion support and graceful behavior when animation frames are
  unavailable.
- Brief-to-concept generation in demo mode, with optional AI generation and a
  validated fallback to sample concepts.
- Editable previews for supported ad platforms with platform-specific
  character limits.
- Optional product visuals generated through Cloudflare Workers AI.
- Optional Supabase-backed share links and private generated-image storage.
- Server-side rate limiting with an in-memory fallback and optional Upstash
  Redis support.
- API schemas and route behavior covered by Vitest tests.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Wildseed's scroll-driven marketing landing page |
| `/studio` | Ad creative studio for briefs, concepts, previews, images, and sharing |
| `/share/[id]` | Public view of a saved concept set |
| `/api/generate` | Generate demo or AI-assisted ad concepts |
| `/api/status` | Report configured capabilities without exposing secrets |
| `/api/image` | Generate and store a product visual |
| `/api/generated-images/[id]` | Serve a stored generated image |
| `/api/share` | Save a concept set and return a share path |
| `/api/share/[id]` | Load a saved concept set |

## Tech stack

- Next.js 16 App Router and React 19
- TypeScript
- Tailwind CSS 4
- GSAP, Lenis, and Framer Motion
- Zod for request and response validation
- Vitest for unit and route tests
- Supabase for optional persistence and image storage
- Cloudflare Workers AI for optional image generation
- Gemini or another OpenAI-compatible provider for optional text generation

## Getting started

### Requirements

- Node.js 22 or newer
- npm
- ffmpeg only if you need to regenerate the landing-page frames

### Install and run

From the repository root:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app
works in demo mode without external API credentials.

### Environment variables

Copy the example configuration and add only the services you plan to use:

```powershell
Copy-Item .env.example .env.local
```

The main configuration groups are:

| Variables | Enables |
| --- | --- |
| `ENABLE_AI`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | AI text generation |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Share links and generated-image storage |
| `ENABLE_IMAGE_GENERATION`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Cloudflare image generation |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate-limit counters |
| `ALLOWED_ORIGINS` | Optional cross-origin API access |

All credentials are server-side values. Do not prefix them with
`NEXT_PUBLIC_`, commit `.env.local`, or expose service-role/secret keys in
client code.

### Supabase setup

Share links and generated images are optional. To enable them:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL Editor.
3. Run [`supabase/generated-images.sql`](./supabase/generated-images.sql) if
   image generation is enabled.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

The generated-image bucket is private and is accessed through the application
API rather than directly from the browser.

## Landing animation frames

The checked-in frames under `public/frames/` are used by the landing page. To
create a new set from source clips:

1. Place the clips at `source/v1.mp4` and `source/v2.mp4`.
2. Install ffmpeg and make sure it is available in your terminal.
3. Run:

   ```powershell
   npm run frames
   ```

The script writes desktop and mobile WebP sequences plus
`public/frames/manifest.json`. See
[`README-landing.md`](./README-landing.md) for frame options, tuning guidance,
and troubleshooting.

Keep source clips out of version control if they are private. The repository's
generated frame assets are the files required at runtime.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run frames` | Generate landing-page frames from source clips |
| `npx vitest run` | Run the test suite |

## Verification

Run the checks that apply to your change:

```powershell
npm run lint
npx vitest run
npm run build
```

The external AI, Cloudflare, and Supabase integrations require their
corresponding credentials and service setup before they can be tested end to
end. Without those services, the app intentionally remains usable through
demo concepts and fallback artwork.

## Project structure

```text
app/                 Pages, layouts, and API routes
components/          Landing-page and Studio UI
lib/                 Validation, providers, prompts, limits, and shared helpers
public/frames/       Runtime landing-animation frame assets
scripts/             Frame-generation tooling
supabase/             Database and storage setup SQL
tests/                Unit and API route tests
```

## License

No license has been published for this repository yet. Treat the source and
assets as private unless the repository owner explicitly grants permission to
reuse them.
