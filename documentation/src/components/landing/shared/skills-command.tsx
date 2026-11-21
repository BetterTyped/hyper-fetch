import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import { ArrowRight, Check, Copy } from "lucide-react";
import React, { useState } from "react";

/*
 * The two calls to action used in the hero and the final CTA: the agent skills install command on the
 * left (click to copy), Get Started as the primary button on the right.
 */
export const SKILLS_INSTALL = "npx skills add BetterTyped/hyper-fetch/skills";

export const SkillsCommand = ({ className }: { className?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy the agent skills install command"
      onClick={() => {
        navigator.clipboard?.writeText(SKILLS_INSTALL).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className={cn(
        "group inline-flex h-12 w-full min-w-0 max-w-full items-center gap-3 rounded-xl border-0 bg-zinc-900/70 px-4 font-mono text-[13px] text-zinc-200 ring-1 ring-inset ring-white/10 backdrop-blur-md transition-colors hover:ring-white/25",
        className,
      )}
    >
      <span className="text-yellow-400">$</span>
      <span className="min-w-0 flex-1 truncate text-left">
        {SKILLS_INSTALL}
      </span>
      {copied ? (
        <Check className="size-4 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="size-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-200" />
      )}
    </button>
  );
};

export const GetStartedButton = ({ className }: { className?: string }) => (
  <Link
    to="/docs/getting-started"
    className={cn(
      "group inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#f9b233] px-7 text-base font-semibold !text-zinc-900 !no-underline transition-[filter] duration-200 hover:brightness-110",
      className,
    )}
  >
    Get Started{" "}
    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
  </Link>
);

export const CtaButtons = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex w-full max-w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center",
      className,
    )}
  >
    <SkillsCommand />
    <GetStartedButton />
  </div>
);
