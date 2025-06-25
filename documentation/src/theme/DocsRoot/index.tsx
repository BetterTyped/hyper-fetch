/* eslint-disable react/destructuring-assignment */
import React, { type ReactNode } from "react";
import clsx from "clsx";
import { ThemeClassNames, HtmlClassNameProvider } from "@docusaurus/theme-common";
import renderRoutes from "@docusaurus/renderRoutes";
import Layout from "@theme/Layout";
import type { Props } from "@theme/DocVersionRoot";

// eslint-disable-next-line import/no-default-export
export default function DocsRoot(props: Props): ReactNode {
  return (
    <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.docsPages)} data-theme="dark">
      <div data-theme="dark">
        <Layout>{renderRoutes(props.route.routes!)}</Layout>
      </div>
    </HtmlClassNameProvider>
  );
}
