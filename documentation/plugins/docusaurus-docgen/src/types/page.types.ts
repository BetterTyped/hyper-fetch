import { JSONOutput } from "typedoc";

import { PluginOptions } from "./package.types";

export type PagePropsType<T = JSONOutput.DeclarationReflection> = {
  reflection: T;
  reflectionTree: JSONOutput.DeclarationReflection[];
  pluginOptions: PluginOptions;
  npmName: string;
  packageName: string;
};
