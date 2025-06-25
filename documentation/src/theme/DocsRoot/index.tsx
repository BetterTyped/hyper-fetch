/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import clsx from "clsx";
import { ThemeClassNames, HtmlClassNameProvider } from "@docusaurus/theme-common";
import renderRoutes from "@docusaurus/renderRoutes";
import Layout from "@theme/Layout";
import type { Props } from "@theme/DocVersionRoot";
import { useLocation } from "@docusaurus/router";
import { cn } from "@site/src/lib/utils";
import PageIllustration from "@site/static/img/page-illustration.svg";
import PageIllustration02 from "@site/static/img/page-illustration-02.svg";

const getColors = (location: string) => {
  if (location.includes("integrations")) {
    return { 1: "bg-green-500", 2: "bg-green-400", 3: "text-green-400" };
  }
  if (location.includes("guides")) {
    return { 1: "bg-indigo-500", 2: "bg-indigo-400", 3: "text-indigo-400" };
  }
  if (location.includes("api")) {
    return { 1: "bg-orange-500", 2: "bg-orange-400", 3: "text-orange-400" };
  }
  return { 1: "bg-yellow-500", 2: "bg-yellow-400", 3: "text-yellow-400" };
};

// eslint-disable-next-line import/no-default-export, @typescript-eslint/naming-convention
export default function DocsRoot(props: Props): JSX.Element {
  const location = useLocation();

  const colors = getColors(location.pathname);
  return (
    <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.docsPages, "docs")}>
      <div className="absolute blur-2xl w-screen max-w-screen h-screen overflow-hidden pointer-events-none">
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 -mb-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <PageIllustration02 width={1440} height={427} className={colors[3]} />
        </div>

        {/* Radial gradient */}
        <div
          className="absolute flex items-center justify-center opacity-50 top-0 -translate-y-3/4 left-1/2 -translate-x-1/3 pointer-events-none -z-10 lg:w-[1200px] aspect-square max-w-[50vw]"
          aria-hidden="true"
        >
          <div className={cn("absolute inset-0 translate-z-0 rounded-full blur-[120px] opacity-30", colors[1])} />
          <div className={cn("absolute w-64 h-64 translate-z-0 rounded-full blur-[80px] opacity-70", colors[2])} />
        </div>

        {/* Illustration */}
        <div
          className="md:block absolute left-1/3 -translate-x-1/2 -mt-16 blur-2xl opacity-30 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <PageIllustration width={1440} height={427} className={colors[3]} />
        </div>
      </div>

      <Layout>{renderRoutes(props.route.routes!)}</Layout>
    </HtmlClassNameProvider>
  );
}
