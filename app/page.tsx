import LandingStory from "@/components/landing/LandingStory";
import SmoothScroll from "@/components/landing/SmoothScroll";
import Vine from "@/components/landing/Vine";
import { Cta, Footer, Process, Proof, Services } from "@/components/landing/Sections";

export default function HomePage() {
  return (
    <SmoothScroll>
      <main>
        <LandingStory />
        <div className="relative lg:pl-[8vw]">
          <Vine />
          <Services />
          <Process />
          <Proof />
          <Cta />
        </div>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
