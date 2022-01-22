export type PluginOptions = {
  rootPath: string;
  packages: PackageOption[];
  apiPath?: string;
};

export type PackageOption = {
  path: string;
  entry: string;
  name?: string;
  tsconfig?: string;
};
