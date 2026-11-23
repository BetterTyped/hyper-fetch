import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { CtaButtons } from "../shared/skills-command";
import { DevtoolsDownload } from "./devtools-download";
import { backends } from "./ecosystem";
import { FramedVideo } from "./framed-video";
import { HeroPaths } from "./hero-paths";

/*
 * The hero: release badge, "Fetch anything. Type everything." with the red type-error squiggle,
 * one line on what is built in, the agent skills command and Get Started, the colour logo row,
 * then the product video and the HyperFlow download. Behind it the request paths run quietly.
 */

const quick = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.35,
    delay: i * 0.05,
    ease: [0.21, 0.47, 0.32, 0.98] as const,
  },
});

const HeroBadge = ({ className }: { className?: string }) => (
  <Link
    to="/blog/hyper-fetch-10-0"
    className={cn(
      "group inline-flex h-8 items-center gap-2.5 rounded-full bg-white/[0.04] pl-1 pr-3 !no-underline ring-1 ring-inset ring-white/10 backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.07] hover:ring-white/20",
      className,
    )}
  >
    <span className="rounded-full bg-[#fbc646]/10 px-2 py-0.5 text-[11px] font-semibold !text-[#fbc646] ring-1 ring-inset ring-[#fbc646]/25">
      v10
    </span>
    <span className="text-[13px] font-medium !text-zinc-300">
      HyperFetch 10 is out. See what is new
    </span>
    <ArrowRight className="size-3.5 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-zinc-200" />
  </Link>
);

const titleBase =
  "!m-0 [font-family:Figtree] font-extrabold !leading-[1.02] tracking-[-0.045em] text-[2.4rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem]";
/* The section title look: a zinc gradient that fades at the top and bottom of each word */
const titleGradient =
  "bg-clip-text !text-transparent bg-gradient-to-b from-zinc-200/60 via-zinc-200 to-zinc-200/60";
/* The second line: the same fading gradient one shade grayer, so the red squiggle carries the accent */
const titleGradientMuted =
  "bg-clip-text !text-transparent bg-gradient-to-b from-zinc-300/60 via-zinc-300 to-zinc-300/60";
/* The accent, the gold of the BetterTyped numbers. The padding keeps the descenders inside the clipped gradient */
const accent = "bt-gold-text pb-[0.08em]";

const Line = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "block pb-[0.06em] [font-size:inherit] [font-weight:inherit]",
      className,
    )}
  >
    {children}
  </span>
);

const Word = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => (
  <span className={cn("[font-size:inherit] [font-weight:inherit]", className)}>
    {children}
  </span>
);

/* The red squiggle TypeScript draws under an error, drawn in once under the word */
const SQUIGGLE =
  "M0 6 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0 q 3.4 -6 6.8 0 t 6.8 0";

const Squiggle = ({
  children,
  className = titleGradient,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span className="relative isolate inline-block [font-size:inherit] [font-weight:inherit]">
    <Word className={className}>{children}</Word>
    <svg
      viewBox="0 0 299.2 12"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -z-10 bottom-[0.04em] -left-[0.06em] h-[0.14em] w-[calc(100%+0.12em)] overflow-visible"
      aria-hidden
    >
      <motion.path
        d={SQUIGGLE}
        fill="none"
        stroke="#f43f5e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.65, 0, 0.35, 1] }}
        style={{ filter: "drop-shadow(0 0 6px rgba(244,63,94,0.45))" }}
      />
    </svg>
  </span>
);

const HeroTitle = () => (
  <h1 className={titleBase}>
    <Line className="">
      <Word className={titleGradient}>Fetch </Word>
      <Word className={accent}>anything.</Word>
    </Line>
    <Line className="">
      <Word className={titleGradientMuted}>Type </Word>
      <Squiggle className={titleGradientMuted}>everything.</Squiggle>
    </Line>
  </h1>
);

const Lead = ({ className }: { className?: string }) => (
  <p
    className={cn(
      "!m-0 max-w-[560px] text-lg leading-relaxed !text-zinc-400 md:text-xl",
      className,
    )}
  >
    Cache, retries, dedupe, offline and realtime, built in. Every protocol
    through one typed{" "}
    <code className="!border-white/10 !bg-white/5 !text-[0.85em] !text-zinc-200">
      createRequest()
    </code>
    .
  </p>
);

/* Colour logos with their names, no label and no divider */
const Logos = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
    {backends.map((b) => (
      <Link
        key={b.name}
        to={b.to}
        className="group flex items-center gap-2 !no-underline"
      >
        <img
          src={b.src}
          alt=""
          className="size-5 object-contain transition-transform duration-200 group-hover:-translate-y-0.5"
          style={b.scale ? { transform: `scale(${b.scale})` } : undefined}
        />
        <span className="text-[14px] font-medium !text-zinc-400 transition-colors duration-200 group-hover:!text-zinc-100">
          {b.name}
        </span>
      </Link>
    ))}
  </div>
);

const Glow = ({ opacity = 1 }: { opacity?: number }) => (
  <div
    className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center"
    style={{ opacity }}
    aria-hidden
  >
    <img src="/img/glow-main.svg" className="max-w-none" width={2546} alt="" />
  </div>
);

const CalmBg = () => (
  <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
    <div className="absolute inset-0 opacity-50">
      <HeroPaths />
    </div>
    <Glow opacity={0.75} />
  </div>
);

export const Hero = () => {
  return (
    <>
      <section className="landing-scope relative w-[100vw] max-w-[100vw] pb-12 pt-[150px] text-center md:pb-16 md:pt-[180px]">
        <CalmBg />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6">
          <motion.div {...quick(0)}>
            <HeroBadge />
          </motion.div>
          <motion.div {...quick(1)} className="mt-7">
            <HeroTitle />
          </motion.div>
          <motion.div {...quick(2)} className="mt-7">
            <Lead className="mx-auto text-center" />
          </motion.div>
          <motion.div {...quick(3)} className="mt-9 w-full max-w-[400px] sm:w-auto sm:max-w-none">
            <CtaButtons />
          </motion.div>
          <motion.div {...quick(4)} className="mt-14">
            <Logos className="justify-center gap-x-5" />
          </motion.div>
        </div>
      </section>
      <FramedVideo className="mb-6" />
      <DevtoolsDownload />
    </>
  );
};
