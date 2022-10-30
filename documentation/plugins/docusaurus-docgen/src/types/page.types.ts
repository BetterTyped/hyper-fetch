import { JSONOutput } from "typedoc";

import { PackageOptions, PluginOptions } from "./package.types";

export type PagePropsType<T = JSONOutput.DeclarationReflection> = {
  reflection: T;
  reflectionsTree: JSONOutput.DeclarationReflection[];
  npmName: string;
  packageName: string;
  pluginOptions: PluginOptions;
  packageOptions: PackageOptions;
};
