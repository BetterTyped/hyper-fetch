import { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs/lib/types";
import * as TypeDoc from "typedoc";

export type PluginOptions = {
  id: string;
  readOnce: boolean;
  docs: DocsPluginOptions;
  packages: PackageOption[];
  typeDocOptions?: Partial<TypeDoc.TypeDocOptions>;
  texts?: TextsOptions;
};

export type PackageOption = {
  title: string;
  dir: string;
  entryPath: string;
  logo?: string;
  description?: string;
  tsconfigName?: string;
  tsconfigDir?: string;
  readmeName?: string;
  readmeDir?: string;
};

export type TextsOptions = {
  monorepoTitle?: string;
  monorepoDescription?: string;
  reference?: string;
  methods?: string;
  parameters?: string;
  typeDefinitions?: string;
  example?: string;
  additionalResources?: string;
  import?: string;
  preview?: string;
  returns?: string;
  deprecated?: string;
  paramTableHeaders: [string, string, string, string];
};

export type PkgMeta = {
  docPath: string;
  file?: File;
};
