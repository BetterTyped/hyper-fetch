import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { Noise } from "../../ui/noise";

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

interface BigFeatureCardProps {
  icon: React.ElementType;
  label: string;
  title: React.ReactNode;
  description: React.ReactNode;
  link: string;
  children: React.ReactNode;
  tags?: string[];
  className?: string;
}

export function BigFeatureCard({
  icon: Icon,
  label,
  title,
  description,
  link,
  children,
  tags,
  className,
}: BigFeatureCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "group relative overflow-hidden rounded-lg",
        "bg-[rgba(28,27,32,0.85)] backdrop-blur-lg",
        "shadow-[0_-1px_#ffdbdf1f,0_0_0_1px_#ffffff0f,2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]",
        "transition-shadow duration-500 hover:shadow-[0_-1px_#ffdbdf2f,0_0_0_1px_#ffffff1a,2px_4px_24px_0px_rgba(248,248,248,0.08)_inset]",
        className,
      )}
    >
      <Noise visibility="medium" />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.04] via-transparent to-orange-500/[0.04]" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-6">
        {/* Text content — top */}
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            <Icon className="size-3.5" />
            {label}
          </span>
          <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight text-zinc-100 md:text-[1.375rem]">
            {title}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{description}</p>
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Animation slot — middle, fixed height to prevent layout shift */}
        <div className="mt-6">
          <div className="h-[280px]">{children}</div>
        </div>

        {/* Learn more — bottom, mt-auto so it pins to card bottom for cross-card alignment */}
        <Link
          to={link}
          className="group/link mt-auto pt-5 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200 hover:no-underline"
        >
          Learn more
          <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}
