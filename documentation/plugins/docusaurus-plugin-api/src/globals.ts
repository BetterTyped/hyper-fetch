import { PkgMeta, PluginOptions } from "./types/package.types";

export let _PLUGIN_OPTS: PluginOptions;
export let _PKG_META: Map<string, PkgMeta> = new Map<string, PkgMeta>();

export const assignPluginOpts = (pluginOpts: PluginOptions) => {
  _PLUGIN_OPTS = pluginOpts;
};

export const addPkgMeta = (key: string, val: PkgMeta) => {
  _PKG_META.set(key, val);
};
