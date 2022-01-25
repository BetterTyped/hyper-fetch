import * as path from "path";
import { LoadContext, Preset } from "@docusaurus/types";
import { name } from "./constants/name.constants";
// import { builder } from "./builder";

export default function preset(context: LoadContext, options: any) {
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);
  console.log(1, 2, 3, 4);

  const pluginStoragePath = path.join(context.generatedFilesDir, name);

  // await builder(context, options);

  console.log(pluginStoragePath, options);

  const config: Preset = {
    themes: [],
    plugins: [["@docusaurus/plugin-content-docs", {}]],
  };

  return config;
}
