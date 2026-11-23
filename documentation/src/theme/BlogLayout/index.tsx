import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import BlogSidebar from "@theme/BlogSidebar";
import type { Props } from "@theme/BlogLayout";

/*
 * The blog uses the docs proportions: the sidebar at the docs sidebar width on the left, the text column at the
 * docs text width beside it and the table of contents on the right, so moving between docs and posts keeps the
 * reading line where it was.
 */
// eslint-disable-next-line import/no-default-export, @typescript-eslint/naming-convention
export default function BlogLayout(props: Props): React.ReactNode {
  const { sidebar, toc, children, ...layoutProps } = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

  return (
    <Layout {...layoutProps}>
      {/* One soft glow at the top, the light the docs use */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 aspect-square w-[720px] max-w-[100vw] -translate-x-1/2 -translate-y-[62%]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full bg-yellow-500 opacity-[0.14] blur-[120px]" />
      </div>

      <div
        className={clsx(
          "blog-layout",
          !!hasSidebar && "blog-layout--sidebar",
          !!toc && "blog-layout--toc",
        )}
      >
        {hasSidebar && <BlogSidebar sidebar={sidebar} />}
        <main
          className="blog-layout__main"
          itemScope
          itemType="https://schema.org/Blog"
        >
          {children}
        </main>
        {toc && <div className="blog-layout__toc">{toc}</div>}
      </div>
    </Layout>
  );
}
