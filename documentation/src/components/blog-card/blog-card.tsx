import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import type { PropBlogPostContent } from "@docusaurus/plugin-content-blog";
import { cn } from "@site/src/lib/utils";
import { ArrowRight } from "lucide-react";
import React from "react";

import { PathsPattern } from "../blog-post-image/patterns";

/*
 * A post in the blog list: a small cover in the README banner style, then the tag, date and reading time, the
 * title, the description and the author. The list never renders the post itself, so every card has the same shape.
 */

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const minutes = (readingTime?: number) =>
  readingTime ? `${Math.max(1, Math.ceil(readingTime))} min read` : null;

/*
 * The cover is framed inside the card, with its own edge and a warmer light than the card, so it reads as an
 * image. Hovering the card lifts it, brightens the border and zooms the cover's texture a little.
 */
export const BlogCover = ({
  title,
  tag,
  featured,
  className,
}: {
  title: string;
  tag?: string;
  featured?: boolean;
  className?: string;
}) => {
  const logo = useBaseUrl("/img/brand/HF.svg");
  return (
    <div
      aria-hidden
      className={cn(
        "relative isolate flex shrink-0 flex-col justify-between overflow-hidden rounded-[16px] bg-[#1a1a1c] p-5",
        "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[16px] after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] after:content-['']",
        featured && "md:p-8",
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
        <div className="absolute inset-0 bg-[radial-gradient(110%_85%_at_78%_-10%,rgba(245,166,35,0.34),rgba(245,166,35,0.08)_45%,transparent_70%)] transition-opacity duration-300 group-hover:opacity-100 opacity-80" />
        <PathsPattern className="!opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_45%)]" />
      </div>
      <div className="relative flex items-center justify-between">
        <img
          src={logo}
          alt=""
          className={cn("w-auto", featured ? "h-5" : "h-4")}
        />
        {tag && (
          <span className="rounded-full border border-solid border-white/15 bg-black/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] !text-zinc-200">
            {tag}
          </span>
        )}
      </div>
      <div
        className={cn(
          "relative line-clamp-3 font-extrabold leading-[1.04] tracking-[-0.04em] !text-white [font-family:Figtree] [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]",
          featured
            ? "max-w-[14ch] text-[1.75rem] md:text-[2.5rem]"
            : "max-w-[16ch] text-[1.4rem]",
        )}
      >
        {title}
      </div>
    </div>
  );
};

export const BlogCard = ({
  metadata,
  featured,
}: {
  metadata: PropBlogPostContent["metadata"];
  featured?: boolean;
}) => {
  const { title, description, permalink, date, readingTime, tags, authors } =
    metadata;
  const author = authors[0];
  const tag = tags[0]?.label;
  const meta = [formatDate(date), minutes(readingTime)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn(
        "blog-card group relative flex rounded-[22px] border border-solid border-white/[0.08] bg-[#1c1c1e] p-2",
        "transition-[transform,border-color,box-shadow] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-white/[0.18] hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.95)]",
        "has-[a:focus-visible]:border-[#fbc646]/60",
        featured ? "flex-col md:col-span-2 md:flex-row" : "flex-col",
      )}
    >
      <BlogCover
        title={title}
        tag={tag}
        featured={featured}
        className={
          featured
            ? "aspect-[16/9] md:aspect-auto md:min-h-[300px] md:w-[55%]"
            : "aspect-[16/8]"
        }
      />
      <div
        className={cn(
          "flex flex-1 flex-col px-3 pb-3 pt-4",
          featured && "md:justify-center md:px-7 md:py-6",
        )}
      >
        <div className="flex items-center gap-2 !text-[13px] !leading-none">
          {tag && (
            <span className="!text-[13px] !font-semibold !text-[#fbc646]">
              {tag}
            </span>
          )}
          {tag && (
            <span aria-hidden className="!text-[13px] !text-zinc-600">
              ·
            </span>
          )}
          <time
            dateTime={new Date(date).toISOString()}
            className="!text-[13px] !text-zinc-400"
          >
            {meta}
          </time>
        </div>
        <h2
          className={cn(
            "!mb-0 !mt-2.5 font-bold leading-snug tracking-[-0.02em]",
            featured ? "text-2xl md:text-[1.75rem]" : "text-[19px]",
          )}
        >
          <Link
            to={permalink}
            className="!text-zinc-50 !no-underline outline-none after:absolute after:inset-0 after:rounded-[22px]"
          >
            {title}
          </Link>
        </h2>
        {description && (
          <p
            className={cn(
              "!mb-0 mt-2 text-[15px] leading-relaxed !text-[#b4b4bc]",
              featured ? "line-clamp-4" : "line-clamp-3",
            )}
          >
            {description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {author ? (
            <span className="flex min-w-0 items-center gap-2.5">
              {author.imageURL && (
                <img
                  src={author.imageURL}
                  alt=""
                  className="size-7 shrink-0 rounded-full ring-1 ring-white/10"
                  loading="lazy"
                />
              )}
              <span className="truncate text-[14px] font-medium !text-zinc-200">
                {author.name}
              </span>
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[13px] font-semibold !text-zinc-200 transition-colors duration-200 group-hover:bg-[#fbc646] group-hover:!text-zinc-900">
            Read
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
