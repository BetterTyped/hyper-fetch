/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { PluginOptions } from '@docusaurus/plugin-content-docs';
import type { LoadContext } from '@docusaurus/types';
export declare function cliDocsVersionCommand(version: string, { id: pluginId, path: docsPath, sidebarPath }: PluginOptions, { siteDir, i18n }: LoadContext): Promise<void>;
