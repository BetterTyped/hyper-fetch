export type PluginOptions = {
  apiDir?: string;
  sidebarPath?: string;
  packages: PackageOption[];
};

export type PackageOption = {
  dir: string;
  entryPath: string;
  title?: string;
  sidebarPath?: string;
  tsconfigName?: string;
  tsconfigDir?: string;
  packageJsonName?: string;
  packageJsonDir?: string;
};
