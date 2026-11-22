import { Highlighter, HighlighterItem } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import { motion } from "motion/react";
import React from "react";

import { fadeUp } from "./section-header";

/*
 * The card from the "From schema to typed SDK" bento, shared by every card section: a solid rounded
 * card, the cursor spotlight on its edge, the illustration and a short title with one line.
 * Wrap a grid of these in <BentoGrid> so the spotlight follows the cursor.
 */

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <Highlighter className={cn("grid gap-4 group", className)}>
    {children}
  </Highlighter>
);

export const BentoCard = ({
  title,
  line,
  icon: Icon,
  children,
  textTop = false,
  className,
  visualClassName,
  dim = false,
  i = 0,
  n,
  split = false,
  feature = false,
}: {
  title: React.ReactNode;
  line?: React.ReactNode;
  icon?: React.ElementType;
  children?: React.ReactNode;
  textTop?: boolean;
  className?: string;
  visualClassName?: string;
  dim?: boolean;
  i?: number;
  /* Feature layout: a number on top, a big title and one line, the illustration below (or beside, with split) */
  n?: string;
  split?: boolean;
  /* The same big-title layout without the number */
  feature?: boolean;
}) => {
  if (n || feature) {
    return (
      <motion.div {...fadeUp(i)} className={cn("min-w-0", className)}>
        <HighlighterItem className="!rounded-3xl">
          <div
            className={cn(
              "relative z-20 flex h-full overflow-hidden rounded-[inherit] bg-[#1f1f21] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
              n ? "p-8" : "px-8 pb-5 pt-8",
              split ? "flex-col gap-8 lg:flex-row" : "flex-col",
            )}
          >
            <div
              className={cn("relative z-10", split && "lg:w-[40%] lg:shrink-0")}
            >
              {n && (
                <div className="bt-gold-text mb-5 font-mono text-[12px] font-semibold">
                  {n}
                </div>
              )}
              <h3 className="!mb-0 !mt-0 text-[26px] font-bold leading-[1.1] tracking-tight text-zinc-100 md:text-[30px]">
                {title}
              </h3>
              {line && (
                <p className="!mb-0 !mt-3 max-w-[400px] text-base leading-relaxed text-zinc-400">
                  {line}
                </p>
              )}
            </div>
            {children && (
              <div
                className={cn(
                  "relative mt-8 min-h-0 flex-1",
                  split && "lg:mt-0",
                  visualClassName,
                )}
              >
                {children}
              </div>
            )}
          </div>
        </HighlighterItem>
      </motion.div>
    );
  }
  const text = (
    <div className={cn("relative z-10 px-7", textTop ? "pt-6" : "pb-6 pt-5")}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <Icon className="size-5 shrink-0 text-[#fbc646]" strokeWidth={1.75} />
        )}
        <h3 className="!m-0 text-lg font-semibold tracking-tight text-zinc-100">
          {title}
        </h3>
      </div>
      {line && (
        <p className="!mb-0 !mt-1.5 max-w-[420px] text-[15px] leading-relaxed text-zinc-400">
          {line}
        </p>
      )}
    </div>
  );
  return (
    <motion.div
      {...fadeUp(i)}
      className={cn("min-w-0", dim && "opacity-75", className)}
    >
      <HighlighterItem className="!rounded-3xl">
        <div className="relative z-20 flex h-full flex-col overflow-hidden rounded-[inherit] bg-[#1f1f21] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {textTop && text}
          {children && (
            <div className={cn("relative min-h-0 flex-1", visualClassName)}>
              {children}
            </div>
          )}
          {!textTop && text}
        </div>
      </HighlighterItem>
    </motion.div>
  );
};
