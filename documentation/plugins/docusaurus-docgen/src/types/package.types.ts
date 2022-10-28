import * as TypeDoc from "typedoc";
import type { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs";

export type PluginOptions = {
  id: string;
  packages: PackageOption[];
  contentDocsOptions: DocsPluginOptions;
  tsConfigPath?: string;
  typeDocOptions?: Partial<TypeDoc.TypeDocOptions>;
};

export type PackageOption = {
  title: string;
  dir: string;
  entryPath: string | string[];
  logo?: string;
  description?: string;
  tsconfigName?: string;
  tsconfigDir?: string;
  readmeName?: string;
  readmeDir?: string;
};

export type PkgMeta = {
  directory: string;
  file?: File;
};
