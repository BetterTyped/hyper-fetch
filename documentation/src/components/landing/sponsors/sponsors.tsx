import { HighlighterItem } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import { motion } from "motion/react";
import React from "react";

import type { FeedPartner } from "../../sponsors/feed";
import { withReferral } from "../../sponsors/feed";
import {
  ArrowIcon,
  Backers,
  PartnerLogo,
  PlusIcon,
} from "../../sponsors/sponsor-rail";
import { useSponsors } from "../../sponsors/use-sponsors";
import { BentoGrid } from "../shared/bento-card";
import { fadeUp, SectionHeader } from "../shared/section-header";
import { useHfMonthlyDownloads } from "../shared/use-hf-downloads";

import "../../sponsors/sponsors.css";

/*
 * Partners and sponsors from the shared sponsors feed: the featured partner large, a free slot that invites the
 * next one, and the people and companies who sponsored HyperFetch. Nothing here is typed in by hand.
 */

const surface =
  "relative z-20 flex h-full flex-col overflow-hidden rounded-[inherit] bg-[#1f1f21] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

const Card = ({
  i,
  className,
  children,
}: {
  i: number;
  className?: string;
  children: React.ReactNode;
}) => (
  <motion.div {...fadeUp(i)} className={cn("min-w-0", className)}>
    <HighlighterItem className="!rounded-3xl">{children}</HighlighterItem>
  </motion.div>
);

const FeaturedPartner = ({
  partner,
  i,
  pair,
}: {
  partner: FeedPartner;
  i: number;
  /** Two featured partners split the row; one shares it with the free slot. */
  pair: boolean;
}) => {
  const accent = partner.accent ?? "#f9b233";
  return (
    <Card i={i} className={cn(!pair && "md:col-span-2")}>
      <a
        href={withReferral(partner.url, "landing")}
        target="_blank"
        rel="noopener sponsored"
        className={cn(
          surface,
          "group/partner p-8 !text-zinc-100 !no-underline",
        )}
        style={{ "--accent": accent } as React.CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover/partner:opacity-100"
          style={{
            background: `radial-gradient(90% 120% at 100% 0%, color-mix(in oklch, ${accent} 22%, transparent), transparent 60%)`,
          }}
        />
        {/* The logo again, large and faded into the corner, so the card reads as theirs before the name does */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 hidden size-[340px] rotate-[-10deg] opacity-[0.13] transition-[opacity,transform] duration-500 [mask-image:radial-gradient(closest-side,#000_35%,transparent)] group-hover/partner:rotate-[-6deg] group-hover/partner:opacity-[0.2] sm:block"
        >
          <PartnerLogo
            partner={partner}
            size={340}
            className="size-full object-contain"
          />
        </div>
        <div className="relative flex h-full flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-6">
            <span className="grid size-16 place-items-center rounded-2xl bg-[#2a2a2d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <PartnerLogo
                partner={partner}
                size={44}
                className="size-11 object-contain"
              />
            </span>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {partner.tier === "house" ? "From BetterTyped" : "Partner"}
              </div>
              <h3 className="!m-0 text-[28px] font-bold leading-[1.1] tracking-tight text-zinc-100 md:text-[32px]">
                {partner.name}
              </h3>
              <p className="!mb-0 !mt-3 max-w-[440px] text-base leading-relaxed text-zinc-400">
                {partner.tagline}
              </p>
            </div>
          </div>
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#2a2a2d] text-zinc-400 transition-colors duration-200 group-hover/partner:text-[color:var(--accent)] [&_svg]:size-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[2.2] [&_svg]:transition-transform [&_svg]:duration-300 group-hover/partner:[&_svg]:-translate-y-0.5 group-hover/partner:[&_svg]:translate-x-0.5"
            style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
          >
            <ArrowIcon />
          </span>
        </div>
      </a>
    </Card>
  );
};

const OpenSlot = ({
  href,
  i,
  wide,
}: {
  href: string;
  i: number;
  wide: boolean;
}) => {
  const downloads = useHfMonthlyDownloads("100k+");
  return (
    <Card i={i} className={cn(wide && "md:col-span-full")}>
      <div className={cn(surface, "p-8")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-[18px] [border:1px_dashed_rgba(255,255,255,0.12)]"
        />
        <div className="relative flex h-full flex-col justify-between gap-8">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#2a2a2d] text-[#f9b233] [&_svg]:size-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[2.2]">
            <PlusIcon />
          </span>
          <div>
            <h3 className="!m-0 text-[22px] font-bold leading-[1.15] tracking-tight text-zinc-100">
              Your logo here
            </h3>
            <p className="!mb-0 !mt-2 text-[15px] leading-relaxed text-zinc-400">
              Your brand on every docs page, seen by the teams behind{" "}
              {downloads} npm downloads a month.
            </p>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-[#f9b233] px-6 text-[15px] font-semibold !text-zinc-900 !no-underline transition-[filter] duration-200 hover:brightness-110"
          >
            Partner with us
          </a>
        </div>
      </div>
    </Card>
  );
};

const PartnerTiles = ({
  partners,
  i,
}: {
  partners: FeedPartner[];
  i: number;
}) => (
  <Card i={i} className="md:col-span-full">
    <div
      className={cn(
        surface,
        "grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {partners.map((partner) => (
        <a
          key={partner.id}
          href={withReferral(partner.url, "landing")}
          target="_blank"
          rel="noopener sponsored"
          title={partner.tagline}
          className="flex items-center gap-3 rounded-2xl bg-[#2a2a2d] px-4 py-3 text-[15px] font-semibold !text-zinc-100 !no-underline transition-[filter] hover:brightness-125"
        >
          <PartnerLogo
            partner={partner}
            size={28}
            className="size-7 rounded-md object-contain"
          />
          <span className="truncate">{partner.name}</span>
        </a>
      ))}
    </div>
  </Card>
);

export const Sponsors = () => {
  const {
    feed,
    featured,
    tiles,
    openSlot,
    backers,
    backersArePast,
    privateCount,
  } = useSponsors();
  let i = 3;

  return (
    <section className="relative pb-20 pt-4">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Support the development"
          title="Partners and sponsors"
          description="HyperFetch is MIT licensed and built in the open. These teams and people keep it moving."
        />
        <BentoGrid
          className={
            featured.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
          }
        >
          {featured.map((partner) => (
            <FeaturedPartner
              key={partner.id}
              partner={partner}
              i={i++}
              pair={featured.length === 2}
            />
          ))}
          {openSlot && (
            <OpenSlot
              href={feed.links.partner}
              i={i++}
              wide={featured.length === 0}
            />
          )}
          {tiles.length > 0 && <PartnerTiles partners={tiles} i={i++} />}
          <Card i={i++} className="md:col-span-full">
            <div
              className={cn(
                surface,
                "gap-6 p-8 md:flex-row md:items-center md:justify-between",
              )}
            >
              <div className="max-w-md">
                <h3 className="!m-0 text-[22px] font-bold leading-[1.15] tracking-tight text-zinc-100">
                  {backersArePast ? "Backed by" : "Sponsored by"}
                </h3>
                <p className="!mb-0 !mt-2 text-[15px] leading-relaxed text-zinc-400">
                  {backersArePast
                    ? "Past sponsors who funded HyperFetch. Be the next one on GitHub Sponsors."
                    : "Every sponsor funds maintenance, docs and new adapters. Join them on GitHub Sponsors."}
                </p>
              </div>
              <div className="flex flex-col gap-5 md:items-end">
                <div className="[&_.bt-sp-faces>a]:size-10 [&_.bt-sp-faces>a]:-ml-2.5 [&_.bt-sp-faces_img]:size-10 [&_.bt-sp-faces>.bt-sp-more]:size-10 [&_.bt-sp-faces>.bt-sp-more]:-ml-2.5 [&_.bt-sp-faces>.bt-sp-more]:text-xs [&_.bt-sp-named]:py-1 [&_.bt-sp-named]:pl-1 [&_.bt-sp-named]:pr-4 [&_.bt-sp-named]:text-[15px] [&_.bt-sp-named_img]:size-8 [&_.bt-sp-backers]:gap-4 md:[&_.bt-sp-backers]:justify-end">
                  <Backers
                    backers={backers}
                    privateCount={privateCount}
                    max={12}
                  />
                </div>
                <a
                  href={feed.links.sponsor}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#f472b6] to-[#db2777] px-6 text-[15px] font-semibold !text-white !no-underline shadow-[0_8px_24px_-10px_rgba(234,74,170,0.7)] transition-[filter] duration-200 hover:brightness-110"
                >
                  Sponsor on GitHub
                </a>
              </div>
            </div>
          </Card>
        </BentoGrid>
      </div>
    </section>
  );
};
