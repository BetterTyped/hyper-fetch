import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import * as React from "react";

export interface VersionTagProps {
  /** The release post the tag opens */
  to: string;
  /** The version it shows, for example "v10" */
  label: string;
  className?: string;
}

/* The current major version beside the star count in the navbar, opening its release post */
export const VersionTag = ({ to, label, className }: VersionTagProps) => (
  <Link
    to={to}
    className={cn(
      "inline-flex h-9 items-center gap-1.5 rounded-xl border border-solid border-[#fbc646]/25 bg-[#fbc646]/[0.07] px-3 font-mono text-sm font-semibold !no-underline transition-colors duration-200 hover:border-[#fbc646]/45 hover:bg-[#fbc646]/[0.12]",
      className,
    )}
  >
    <span className="size-1.5 rounded-full bg-[#fbc646] shadow-[0_0_8px_rgba(251,198,70,0.8)]" />
    <span className="bt-gold-text">{label}</span>
  </Link>
);
