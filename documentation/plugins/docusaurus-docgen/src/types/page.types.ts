import { JSONOutput } from "typedoc";

import {
  PackageOptions,
  PluginOptions,
  PackageOptionsFile,
  PackageOptionsFileParts,
} from "./package.types";

export type PagePropsType<T = JSONOutput.DeclarationReflection> = {
  reflection: T;
  reflectionsTree: JSONOutput.DeclarationReflection[];
  npmName: string;
  packageName: string;
  pluginOptions: PluginOptions | PackageOptionsFile;
  packageOptions: PackageOptions | PackageOptionsFileParts;
};
