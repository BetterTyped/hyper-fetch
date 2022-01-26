import { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs/lib/types";

export type PluginOptions = {
  id: string;
  docs: DocsPluginOptions;
  packages: PackageOption[];
};

export type PackageOption = {
  dir: string;
  entryPath: string;
  title: string;
  tsconfigName?: string;
  tsconfigDir?: string;
};
