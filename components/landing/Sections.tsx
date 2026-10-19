import Link from "next/link";
import Bloom from "./Bloom";
import MotionChapter from "./MotionChapter";
import MotionProcess from "./MotionProcess";
import Metric from "./Metric";

const SERVICES = [
  { n: "01", title: "Strategy", tag: "Plant the idea", body: "We start by listening: your customers, your numbers, your market. Then we choose the few bets worth making.", items: ["Audience and market research", "Positioning and messaging", "Channel and budget plan"] },
  { n: "02", title: "Creative", tag: "Grow the story", body: "Campaigns, content and design that give people a reason to care, built to work in every format you run.", items: ["Campaign concepts", "Social and video content", "Landing pages and ad creative"] },
  { n: "03", title: "Media", tag: "Reach the light", body: "Paid and organic placement where your buyers already are, measured against the goals we agreed on.", items: ["Paid social and search", "SEO and email", "Reporting you can read"] },
];

const STEPS = [
  { title: "Listen", when: "Week 1", body: "Interviews, an audit of what you have, and a clear goal with a number on it." },
  { title: "Plant", when: "Weeks 2 to 4", body: "Strategy, creative and a first campaign live, so you see real results early." },
  { title: "Tend", when: "Ongoing", body: "We test, learn and report every month, and put more into what is working." },
];

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-28 md:px-10 md:py-40">
      <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:h-fit">
          <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">FIG. 00 / What we do</p>
          <h2 className="mt-6 max-w-md font-display text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.98] tracking-[-0.02em] text-ink">
            Three ways we help you <em className="text-coral">grow.</em>
          </h2>
          <p className="mt-8 max-w-sm text-[17px] leading-[1.65] text-ink/70">Good growth starts with a clear place to put your attention.</p>
          <p className="mt-16 hidden font-display text-lg italic text-leaf lg:block">Field notes, 2025</p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          {SERVICES.map((service, index) => <MotionChapter key={service.n} service={service} index={index} />)}
        </div>
      </div>
    </section>
  );
}

export function Process() {
  return (
    <section id="process" className="relative overflow-hidden bg-card py-28 md:py-40">
      <svg aria-hidden="true" className="absolute inset-x-0 top-0 h-8 w-full -translate-y-1/2 text-paper" preserveAspectRatio="none" viewBox="0 0 1200 32">
        <path d="M0 16 C150 4 270 28 420 16 S700 4 850 16 S1050 28 1200 16 V0 H0Z" fill="currentColor" />
      </svg>
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">FIG. 02 / How we work</p>
        <h2 className="mt-6 max-w-3xl font-display text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.98] tracking-[-0.02em] text-ink">
          Simple, steady, <em className="text-coral">measured.</em>
        </h2>
        <MotionProcess steps={STEPS} />
      </div>
      <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-8 w-full translate-y-1/2 text-paper" preserveAspectRatio="none" viewBox="0 0 1200 32">
        <path d="M0 16 C150 28 270 4 420 16 S700 28 850 16 S1050 4 1200 16 V32 H0Z" fill="currentColor" />
      </svg>
    </section>
  );
}

export function Proof() {
  return (
    <section id="proof" className="mx-auto max-w-7xl px-6 py-28 md:px-10 md:py-40">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-[11px] tracking-[0.22em] text-ink/60 uppercase">FIG. 03 / Results</p>
          <h2 className="mt-6 max-w-md font-display text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.98] tracking-[-0.02em] text-ink">
            Growth you can see in the <em className="text-coral">data.</em>
          </h2>
        </div>
        <div className="grid gap-12 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-7 lg:gap-x-10">
          <Metric value="3.2x" label="Average return on ad spend" figure="FIG. 04" lead />
          <Metric value="+148%" label="Organic traffic in six months" figure="FIG. 05" offset />
          <Metric value="42" label="Brands grown" figure="FIG. 06" />
          <Metric value="9 days" label="From kickoff to first campaign" figure="FIG. 07" offset />
        </div>
      </div>
      <p className="mt-14 text-sm text-ink/60">Sample data for a fictional studio.</p>
    </section>
  );
}

export function Cta() {
  return (
    <section className="relative overflow-hidden bg-coral px-6 py-28 md:px-10 md:py-40">
      <svg aria-hidden="true" className="absolute inset-x-0 top-0 h-8 w-full -translate-y-1/2 text-paper" preserveAspectRatio="none" viewBox="0 0 1200 32">
        <path d="M0 16 C180 28 270 4 450 16 S720 28 900 16 S1060 4 1200 16 V0 H0Z" fill="currentColor" />
      </svg>
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] tracking-[0.22em] text-ink/70 uppercase">FIG. 08 / Begin</p>
        <h2 className="mt-8 max-w-6xl font-display text-[clamp(3.5rem,11vw,10rem)] leading-[0.9] tracking-[-0.03em] text-ink">Let&apos;s plant something.</h2>
        <p className="mt-10 max-w-xl text-[17px] leading-[1.65] text-ink">Tell us what you want to grow, or try the studio and see the ads we would write for your brand.</p>
        <Link href="/studio" className="group mt-10 inline-flex min-h-11 items-center gap-5 rounded-full bg-ink px-7 py-3.5 text-paper outline-2 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-ink focus-visible:outline-ink">
          <span>Try the Studio</span><span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">-&gt;</span>
        </Link>
        <Bloom />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="overflow-hidden border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-6 pt-16 md:px-10 md:pt-24">
        <p className="-mb-[0.12em] whitespace-nowrap font-display text-[clamp(5rem,22vw,20rem)] leading-[0.72] tracking-[-0.05em] text-[#DCE6D5]">Wildseed</p>
        <div className="flex flex-col gap-3 border-t border-line py-8 text-sm text-ink/65 md:flex-row md:items-center md:justify-between">
          <p>Sample site: Wildseed is a fictional studio and all data is made up.</p>
          <p className="font-display text-xl text-ink">Field notes / 2025</p>
        </div>
      </div>
    </footer>
  );
}
