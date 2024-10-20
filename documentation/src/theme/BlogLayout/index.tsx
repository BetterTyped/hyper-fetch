import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import BlogSidebar from "@theme/BlogSidebar";
import type { Props } from "@theme/BlogLayout";
import { Particles } from "@site/src/components";

// eslint-disable-next-line import/no-default-export, @typescript-eslint/naming-convention
export default function BlogLayout(props: Props): JSX.Element {
  const { sidebar, toc, children, ...layoutProps } = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

  return (
    <Layout {...layoutProps}>
      {/* Particles animation */}
      <Particles className="absolute inset-0 -z-10 h-[50vh]" quantity={12} staticity={30} />

      {/* Radial gradient */}
      <div
        className="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-[800px] aspect-square max-w-[100vw]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 translate-z-0 bg-blue-500 rounded-full blur-[120px] opacity-30" />
        <div className="absolute w-64 h-64 translate-z-0 bg-blue-400 rounded-full blur-[80px] opacity-70" />
      </div>

      {/* Illustration */}
      <div
        className="md:block absolute left-1/2 -translate-x-1/2 -mt-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
        aria-hidden="true"
      >
        <img src="/img/page-illustration.svg" width={1440} height={427} alt="Page Illustration" />
      </div>

      {/* Title */}
      <div className="container margin-vert--lg !mt-10">
        <div className="row">
          <BlogSidebar sidebar={sidebar} />
          <main
            className={clsx("col", {
              "col--7": hasSidebar,
              "col--9 col--offset-1": !hasSidebar,
            })}
            itemScope
            itemType="https://schema.org/Blog"
          >
            {children}
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
    </Layout>
  );
}
