# HealYou

Find and book emergency beds, OPD appointments and diagnostic tests at hospitals in the
Chandigarh Tricity (Chandigarh, Mohali, Panchkula, Zirakpur). Hospitals get their own portal to
manage beds, doctors, departments and incoming requests.

## Features

- **Patients:** find hospitals near you, see live bed counts, request an emergency bed (name, age,
  gender, associated conditions, chief complaint), book OPD slots and tests, track bookings.
- **Hospitals:** register, upload photos, manage departments, doctors, beds and tests, accept or
  reject requests.
- **Admin:** review and approve new hospitals before they appear to patients.
- **Email verification:** new accounts confirm their email with a 6-digit code.

## Tech

TanStack Start (React 19, server rendering), TanStack Router and Query, Tailwind CSS 4 with shadcn/ui,
Supabase (Postgres, Auth, Storage, Realtime). Deploys to Cloudflare Workers.

## Run it locally

You need Node.js 20 or newer.

```sh
npm install
cp .env.example .env.local      # then fill in the two Supabase values
npm run dev                     # http://localhost:8080
```

On Windows, copy the file in File Explorer or VS Code and name it `.env.local`.

| Variable                        | Where it comes from                                                |
| ------------------------------- | ------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | Supabase, Project Settings, API, Project URL                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase, Project Settings, API, publishable (anon) key            |
| `VITE_ENABLE_GOOGLE_AUTH`       | `true` only after Google is enabled in Supabase; otherwise `false` |

Never put the Supabase secret or service-role key in these files or in the browser code.

## 1. Set up Supabase

1. Create a free project at supabase.com (region: South Asia, Mumbai).
2. Build the database: follow [`supabase/setup/README.md`](supabase/setup/README.md).
3. **Authentication, URL Configuration:** set **Site URL** to your site (`http://localhost:8080`
   while developing) and add the same address under **Redirect URLs**. Add your live address too
   when you deploy.
4. **Authentication, Sign In / Providers, Email:** turn **Confirm email** on.
5. **Authentication, Email Templates, Confirm sign up:** make the email carry the code. Use this
   body (the `{{ .Token }}` placeholder is what inserts the 6-digit code):

   ```html
   <h2>Verify your email</h2>
   <p>Your HealYou verification code is:</p>
   <h1 style="letter-spacing:6px">{{ .Token }}</h1>
   <p>This code expires in 10 minutes. If you did not sign up, ignore this email.</p>
   ```

6. **Authentication, SMTP Settings:** connect a real email sender. Supabase's built-in sender is
   only for testing and is heavily rate limited. Any SMTP service works; Brevo, Resend and Google
   Workspace are common choices. Use a sender address on a domain you own.

### Optional: Google sign-in

1. In Google Cloud Console create an OAuth client (type Web application). Add
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` as an authorized redirect URI.
2. In Supabase, Authentication, Providers, Google: enable it and paste the client ID and secret.
3. Set `VITE_ENABLE_GOOGLE_AUTH=true` and rebuild.
4. To let any Google user sign in, Google needs your app in production mode, which requires a homepage
   and a privacy policy link on a domain you own: use `https://YOUR-DOMAIN/privacy` and
   `https://YOUR-DOMAIN/terms` (both pages are in this project). Do not upload an app logo, because
   that triggers a manual Google review.

## 2. Deploy to Cloudflare Workers (free tier)

1. Push this repository to GitHub.
2. Cloudflare dashboard, **Workers and Pages, Create, Import a repository**, pick the repository.
3. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
4. Under **Variables and secrets for the build** add `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` and (optional) `VITE_ENABLE_GOOGLE_AUTH`. These are read while
   building, so after changing one, trigger a new deploy.
5. After the first deploy, put the new address in Supabase **Redirect URLs** (step 3 above).
6. Optional: add a custom domain under the Worker's Settings, Domains and Routes.

Deploying from your own computer instead: `npx wrangler login`, then `npm run deploy`.

To build for another host, set `NITRO_PRESET` (for example `node-server` or `netlify`) before
`npm run build`.

## 3. Keep it healthy (GitHub Actions)

- `.github/workflows/ci.yml` typechecks, lints and builds on every push.
- `.github/workflows/keepalive.yml` reads one row every 3 days so a free Supabase project does not
  pause. Add repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- `.github/workflows/backup.yml` makes a weekly database backup. Add the secret `SUPABASE_DB_URL`
  (the Session pooler connection string). **Keep the repository private**: backups contain user data.

## Scripts

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Development server on port 8080    |
| `npm run build`     | Production build                   |
| `npm run preview`   | Serve the production build locally |
| `npm run typecheck` | TypeScript check                   |
| `npm run lint`      | ESLint and Prettier check          |
| `npm run format`    | Format all files                   |
| `npm run deploy`    | Build and deploy to Cloudflare     |

## Project layout

```
src/routes/            pages (file-based routing): /, /hospitals, /auth, /bookings, /portal, /admin
src/components/        site components and shadcn/ui primitives
src/lib/               auth context, photo upload and compression, location helpers
src/integrations/      Supabase client and generated database types
supabase/setup/        SQL to build a new database
supabase/migrations/   the same schema as dated migration files
docs/product-spec.md   the original product specification
```

## Roles

- `patient`: default for new accounts.
- `hospital_staff`: chosen at sign-up; manages one hospital in the portal.
- `super_admin`: approves hospitals. Granted only in the database, never from the app.

## Notes

- Hospital photos are resized in the browser before upload (longest side 1600px, WebP) so the free
  1 GB storage lasts far longer.
- The app has no server-side secrets: all data access goes through Supabase with row-level
  security. Keep row-level security enabled on every table.
- This app handles health data. Before a real launch, review privacy obligations (India's DPDP Act).
