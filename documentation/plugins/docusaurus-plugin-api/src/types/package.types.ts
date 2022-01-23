export type PluginOptions = {
  apiDir?: string;
  packages: PackageOption[];
};

export type PackageOption = {
  dir: string;
  entryPath: string;
  title?: string;
  tsconfigName?: string;
  tsconfigDir?: string;
  packageJsonName?: string;
  packageJsonDir?: string;
};
