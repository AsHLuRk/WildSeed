import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import SharedAds from "@/components/studio/SharedAds";
import { fetchShare, getSupabaseConfig, SHARE_ID_PATTERN } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Shared ad ideas | Wildseed Studio",
  robots: { index: false, follow: false },
};

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 bg-paper px-6 text-center">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{title}</h1>
      <p className="max-w-md text-ink/75">{body}</p>
      <Link href="/studio" className="rounded-full bg-coral px-6 py-3 font-medium text-ink">
        Open the Studio
      </Link>
    </main>
  );
}

async function SharedContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!SHARE_ID_PATTERN.test(id)) notFound();

  await connection();
  const cfg = getSupabaseConfig();
  if (!cfg) return <Message title="Sharing isn’t set up" body="This site can’t load saved ideas right now." />;

  let payload;
  try {
    payload = await fetchShare(cfg, id);
  } catch (err) {
    console.error("[share page] load failed:", err instanceof Error ? err.message : "unknown");
    return <Message title="We couldn’t load these ideas" body="Something went wrong on our side. Please try the link again in a moment." />;
  }
  if (!payload) notFound();
  return <SharedAds payload={payload} />;
}

// With Cache Components on, anything that reads the request or the database must sit inside <Suspense>.
export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-paper text-ink/60" role="status">
          Loading ideas…
        </main>
      }
    >
      <SharedContent params={params} />
    </Suspense>
  );
}
