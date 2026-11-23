import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import { ArrowUpRight } from "lucide-react";
import React from "react";

export interface HighlightsProps {
  children: React.ReactNode;
  className?: string;
}

export interface HighlightProps {
  /** One to three words, the name of the change */
  title: string;
  /** The section of the post that explains it, for example "#infinite-lists" */
  to?: string;
  /** One sentence on what the reader gains */
  children: React.ReactNode;
}

/*
 * The "What's new" list of a post as a grid of numbered cards. Each card is a title and one line, and opens the
 * section that explains it, so the reader can scan the release and jump to the part they care about.
 */
export const Highlights = ({ children, className }: HighlightsProps) => (
  <div
    className={cn(
      "not-prose my-8 grid gap-2.5 [counter-reset:highlight] sm:grid-cols-2",
      className,
    )}
  >
    {children}
  </div>
);

const cardClassName = cn(
  "group relative flex flex-col gap-1.5 rounded-2xl bg-[#1f1f21] p-4 pr-10 !no-underline ring-1 ring-inset ring-white/[0.06]",
  "[counter-increment:highlight] transition-[background-color,box-shadow] duration-200",
);

export const Highlight = ({ title, to, children }: HighlightProps) => {
  const content = (
    <>
      <span className="flex items-baseline gap-2.5">
        <span
          aria-hidden
          className="bt-gold-text font-mono text-xs font-semibold tabular-nums before:content-[counter(highlight,decimal-leading-zero)]"
        />
        <span className="text-[15px] font-semibold tracking-[-0.01em] !text-zinc-100">
          {title}
        </span>
      </span>
      <span className="text-sm leading-relaxed !text-zinc-400 [&_code]:!text-[12.5px] [&_code]:!text-zinc-200 [&_p]:m-0 [&_p]:!text-inherit">
        {children}
      </span>
    </>
  );

  if (!to) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Link
      to={to}
      className={cn(
        cardClassName,
        "hover:bg-[#252528] hover:ring-white/[0.12]",
      )}
    >
      {content}
      <ArrowUpRight className="absolute right-3.5 top-4 size-4 text-zinc-600 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#fbc646]" />
    </Link>
  );
};
