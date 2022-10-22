import { LoadContext } from "@docusaurus/types";

export const preparePluginConfig = (context: LoadContext, apiDir: string, sidebarPath?: string) => {
  context.siteConfig.plugins?.push([
    "@docusaurus/plugin-content-docs",
    {
      id: "docusaurus-plugin-api",
      path: apiDir,
      routeBasePath: apiDir,
      sidebarPath,
    },
  ]);
};
