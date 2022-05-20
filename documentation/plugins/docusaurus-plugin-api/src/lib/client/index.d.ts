/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { GlobalPluginData, GlobalVersion, ActivePlugin, ActiveDocContext, DocVersionSuggestions } from '@docusaurus/plugin-content-docs/client';
import type { UseDataOptions } from '@docusaurus/types';
export declare const useAllDocsData: () => {
    [pluginId: string]: GlobalPluginData;
};
export declare const useDocsData: (pluginId: string | undefined) => GlobalPluginData;
export declare function useActivePlugin(options?: UseDataOptions): ActivePlugin | undefined;
export declare function useActivePluginAndVersion(options?: UseDataOptions): {
    activePlugin: ActivePlugin;
    activeVersion: GlobalVersion | undefined;
} | undefined;
export declare function useVersions(pluginId: string | undefined): GlobalVersion[];
export declare function useLatestVersion(pluginId: string | undefined): GlobalVersion;
export declare function useActiveVersion(pluginId: string | undefined): GlobalVersion | undefined;
export declare function useActiveDocContext(pluginId: string | undefined): ActiveDocContext;
export declare function useDocVersionSuggestions(pluginId: string | undefined): DocVersionSuggestions;
