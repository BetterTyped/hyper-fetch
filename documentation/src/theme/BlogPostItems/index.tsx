import React from "react";
import type { Props } from "@theme/BlogPostItems";
import { BlogCard } from "@site/src/components/blog-card/blog-card";

/**
 * The blog list, tag and author pages show cards instead of each post's intro. The newest post on the page is
 * featured across both columns.
 */
// eslint-disable-next-line import/no-default-export
export default function BlogPostItems({ items }: Props): React.ReactNode {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ content }, index) => (
        <BlogCard
          key={content.metadata.permalink}
          metadata={content.metadata}
          featured={index === 0}
        />
      ))}
    </div>
  );
}
