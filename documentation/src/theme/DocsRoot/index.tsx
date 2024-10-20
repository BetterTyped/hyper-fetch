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

// eslint-disable-next-line import/no-default-export, @typescript-eslint/naming-convention
export default function DocsRoot(props: Props): JSX.Element {
  return (
    <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.docsPages)}>
      <div className="blur-2xl">
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 -mb-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <img src="/img/page-illustration-02.svg" width={1440} height={427} alt="Page Illustration 02" />
        </div>

        {/* Radial gradient */}
        <div
          className="absolute flex items-center justify-center opacity-50 top-0 -translate-y-3/4 left-1/2 -translate-x-1/3 pointer-events-none -z-10 lg:w-[1200px] aspect-square max-w-[50vw]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 translate-z-0 bg-blue-500 rounded-full blur-[120px] opacity-30" />
          <div className="absolute w-64 h-64 translate-z-0 bg-blue-400 rounded-full blur-[80px] opacity-70" />
        </div>

        {/* Illustration */}
        <div
          className="md:block absolute left-1/3 -translate-x-1/2 -mt-16 blur-2xl opacity-30 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <img src="/img/page-illustration.svg" width={1440} height={427} alt="Page Illustration" />
        </div>
      </div>

      <Layout>{renderRoutes(props.route.routes!)}</Layout>
    </HtmlClassNameProvider>
  );
}
