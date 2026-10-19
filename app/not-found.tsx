import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 bg-paper px-6 text-center">
      <p className="text-xs tracking-[0.25em] text-ink/60 uppercase">404</p>
      <h1 className="font-display text-5xl text-ink">That page didn’t grow.</h1>
      <p className="max-w-md text-ink/75">The link may be wrong or the page may have moved.</p>
      <Link href="/" className="rounded-full bg-coral px-6 py-3 font-medium text-ink">
        Back to Wildseed
      </Link>
    </main>
  );
}
