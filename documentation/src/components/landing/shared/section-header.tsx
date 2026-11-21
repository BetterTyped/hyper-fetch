import { Title } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import { motion } from "motion/react";
import React from "react";

/*
 * The one section head every landing section uses: optional eyebrow, the zinc gradient title,
 * optional one-line description. The spacing is fixed here so every head reads the same:
 * eyebrow → title 12px, title → description 16px, head → content 48px (56px from md).
 * Sections pass `className="mb-0"` only when the head stands alone (the CTA).
 */
export const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -60px 0px" },
  transition: {
    duration: 0.4,
    delay: i * 0.05,
    ease: [0.21, 0.47, 0.32, 0.98] as const,
  },
});

export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "inline-flex text-base font-medium leading-6 bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200",
      className,
    )}
  >
    {children}
  </div>
);

/* The title alone, for heads that are built by hand (it keeps the same type and tight leading) */
export const SectionTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Title
    wrapperClass={cn(
      "h2 !m-0 !leading-[1.15] bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60",
      className,
    )}
  >
    {children}
  </Title>
);

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "mb-12 flex max-w-3xl flex-col md:mb-14",
      align === "center"
        ? "mx-auto items-center text-center"
        : "items-start text-left",
      className,
    )}
  >
    {eyebrow && (
      <motion.div {...fadeUp(0)} className="mb-3">
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>
    )}
    <motion.div {...fadeUp(1)}>
      <SectionTitle>{title}</SectionTitle>
    </motion.div>
    {description && (
      <motion.p
        {...fadeUp(2)}
        className="!mb-0 mt-4 max-w-2xl text-lg leading-relaxed !text-zinc-400"
      >
        {description}
      </motion.p>
    )}
    {children}
  </div>
);

/* The card surface the landing already uses (Hub, Preview, Blocks): zinc-900, hairline border, inset glow, noise. */
export const cardSurface = cn(
  "relative isolate overflow-hidden rounded-2xl bg-zinc-900/80 bg-with-noise",
  "[border:1px_solid_rgba(255,255,255,.1)]",
  "[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
);
