import * as TypeDoc from "typedoc";
import type { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs";

export type PluginOptions = {
  id: string;
  packages: PackageOptions[];
  contentDocsOptions: DocsPluginOptions;
  tsConfigPath?: string;
  typeDocOptions?: Partial<TypeDoc.TypeDocOptions>;
};

export type PackageOptions = {
  title: string;
  dir: string;
  entryPath: string | string[];
  logo?: string;
  description?: string;
  tsconfigName?: string;
  tsconfigDir?: string;
  readmeName?: string;
  readmeDir?: string;
  showImports?: boolean;
};

export type PkgMeta = {
  title: string;
  packageDocsJsonPath: string;
  packageDocsDir: string;
};
