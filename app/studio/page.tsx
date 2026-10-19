import type { Metadata } from "next";
import StudioApp from "@/components/studio/StudioApp";

export const metadata: Metadata = {
  title: "Studio | Wildseed",
  description: "Write three ad ideas from a short brief and preview them on Instagram, LinkedIn and Google.",
};

export default function StudioPage() {
  return <StudioApp />;
}
