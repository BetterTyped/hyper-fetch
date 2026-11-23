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
        "relative flex flex-col justify-between overflow-hidden bg-[#1d1d1f] p-5",
        featured && "md:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-24 left-[62%] h-52 w-80 -translate-x-1/2 rounded-full bg-[#f5a623]/[0.16] blur-[70px]" />
      <PathsPattern className="!opacity-25 [mask-image:linear-gradient(to_bottom,transparent,black_40%)]" />
      <div className="relative flex items-center justify-between">
        <img
          src={logo}
          alt=""
          className={cn("w-auto opacity-90", featured ? "h-5" : "h-4")}
        />
        {tag && (
          <span className="rounded-full border border-solid border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            {tag}
          </span>
        )}
      </div>
      <div
        className={cn(
          "relative line-clamp-3 font-extrabold leading-[1.04] tracking-[-0.04em] text-zinc-50 [font-family:Figtree]",
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
        "blog-card group relative flex overflow-hidden rounded-[20px] bg-[#1f1f21] ring-1 ring-inset ring-white/[0.06] transition-[box-shadow,background-color] duration-300 hover:bg-[#232326] hover:ring-white/[0.13]",
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
          "flex flex-1 flex-col p-5",
          featured && "md:justify-center md:p-8",
        )}
      >
        <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
          {tag && <span className="font-semibold text-[#fbc646]">{tag}</span>}
          {tag && <span aria-hidden>·</span>}
          <time dateTime={new Date(date).toISOString()}>{meta}</time>
        </div>
        <h2
          className={cn(
            "!mb-0 !mt-2 font-bold leading-snug tracking-[-0.02em]",
            featured ? "text-2xl md:text-[1.75rem]" : "text-lg",
          )}
        >
          <Link
            to={permalink}
            className="!text-zinc-100 !no-underline after:absolute after:inset-0"
          >
            {title}
          </Link>
        </h2>
        {description && (
          <p
            className={cn(
              "!mb-0 mt-2 text-[14.5px] leading-relaxed !text-zinc-400",
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
              <span className="truncate text-[13px] font-medium text-zinc-300">
                {author.name}
              </span>
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-[13px] font-semibold text-zinc-400 transition-colors group-hover:text-[#fbc646]">
            Read
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
