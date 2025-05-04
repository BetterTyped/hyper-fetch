import Link from "@docusaurus/Link";
import { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { GuidesIcon, DocsIcon, PromoIcon, ExternalLinkIcon } from "./icons";
import { Noise } from "../ui/noise";

const linkCardVariants = cva(
  [
    "px-4 py-6 my-4 !no-underline overflow-hidden",
    "relative flex flex-col gap-2 rounded-xl transition-all duration-200 border cursor-pointer focus:outline-none",
    "hover:ring-2 focus:ring-2",
    "transform-gpu will-change-transform",
  ].join(" "),
  {
    variants: {
      type: {
        guides: ["bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 ring-zinc-700"].join(" "),
        docs: ["bg-gradient-to-br from-zinc-950 to-zinc-900 border-zinc-700 ring-zinc-700"].join(" "),
        promo: ["bg-blue-900 border-blue-500/30 ring-blue-400"].join(),
        external: ["bg-pink-900 border-pink-500/30 ring-pink-400"].join(" "),
      },
    },
    defaultVariants: {
      type: "docs",
    },
  },
);

type CardType = "guides" | "docs" | "promo" | "external";

interface LinkCardProps extends ComponentProps<typeof Link>, VariantProps<typeof linkCardVariants> {
  title: string;
  description?: string;
  type?: CardType;
}

const iconMap: Record<CardType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  guides: GuidesIcon,
  docs: DocsIcon,
  promo: PromoIcon,
  external: ExternalLinkIcon,
};

const typesNoiseOpacity = {
  guides: "!opacity-[0.02]",
  docs: "!opacity-[0.03]",
  promo: "!opacity-[0.05]",
  external: "!opacity-[0.05]",
};

export const LinkCard = ({ title, description, type = "docs", className, ...props }: LinkCardProps) => {
  const Icon = iconMap[type];

  return (
    <Link {...props} className={linkCardVariants({ type, className })}>
      <div className="inset-0 absolute [background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.5),rgba(255,255,255,0))] z-[-1] opacity-30" />
      <Noise className={typesNoiseOpacity[type]} />
      <div className="flex items-start gap-4 mb-2">
        <span className="text-2xl opacity-90">
          <Icon className="w-8 h-8 " />
        </span>
        <div className="flex flex-col">
          <div className="text-xl font-semibold tracking-tight leading-tight mt-[3px] !text-white">{title}</div>
          {description && <div className="text-base text-zinc-300 leading-normal mt-1">{description}</div>}
        </div>
      </div>
    </Link>
  );
};
