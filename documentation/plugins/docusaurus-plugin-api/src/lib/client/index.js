"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDocVersionSuggestions = exports.useActiveDocContext = exports.useActiveVersion = exports.useLatestVersion = exports.useVersions = exports.useActivePluginAndVersion = exports.useActivePlugin = exports.useDocsData = exports.useAllDocsData = void 0;
const router_1 = require("@docusaurus/router");
const useGlobalData_1 = require("@docusaurus/useGlobalData");
const docsClientUtils_1 = require("./docsClientUtils");
// Important to use a constant object to avoid React useEffect executions etc.
// see https://github.com/facebook/docusaurus/issues/5089
const StableEmptyObject = {};
// In blog-only mode, docs hooks are still used by the theme. We need a fail-
// safe fallback when the docs plugin is not in use
const useAllDocsData = () => (0, useGlobalData_1.useAllPluginInstancesData)('docusaurus-plugin-content-docs') ??
    StableEmptyObject;
exports.useAllDocsData = useAllDocsData;
const useDocsData = (pluginId) => (0, useGlobalData_1.usePluginData)('docusaurus-plugin-content-docs', pluginId, {
    failfast: true,
});
exports.useDocsData = useDocsData;
// TODO this feature should be provided by docusaurus core
function useActivePlugin(options = {}) {
    const data = (0, exports.useAllDocsData)();
    const { pathname } = (0, router_1.useLocation)();
    return (0, docsClientUtils_1.getActivePlugin)(data, pathname, options);
}
exports.useActivePlugin = useActivePlugin;
function useActivePluginAndVersion(options = {}) {
    const activePlugin = useActivePlugin(options);
    const { pathname } = (0, router_1.useLocation)();
    if (!activePlugin) {
        return undefined;
    }
    const activeVersion = (0, docsClientUtils_1.getActiveVersion)(activePlugin.pluginData, pathname);
    return {
        activePlugin,
        activeVersion,
    };
}
exports.useActivePluginAndVersion = useActivePluginAndVersion;
function useVersions(pluginId) {
    const data = (0, exports.useDocsData)(pluginId);
    return data.versions;
}
exports.useVersions = useVersions;
function useLatestVersion(pluginId) {
    const data = (0, exports.useDocsData)(pluginId);
    return (0, docsClientUtils_1.getLatestVersion)(data);
}
exports.useLatestVersion = useLatestVersion;
function useActiveVersion(pluginId) {
    const data = (0, exports.useDocsData)(pluginId);
    const { pathname } = (0, router_1.useLocation)();
    return (0, docsClientUtils_1.getActiveVersion)(data, pathname);
}
exports.useActiveVersion = useActiveVersion;
function useActiveDocContext(pluginId) {
    const data = (0, exports.useDocsData)(pluginId);
    const { pathname } = (0, router_1.useLocation)();
    return (0, docsClientUtils_1.getActiveDocContext)(data, pathname);
}
exports.useActiveDocContext = useActiveDocContext;
function useDocVersionSuggestions(pluginId) {
    const data = (0, exports.useDocsData)(pluginId);
    const { pathname } = (0, router_1.useLocation)();
    return (0, docsClientUtils_1.getDocVersionSuggestions)(data, pathname);
}
exports.useDocVersionSuggestions = useDocVersionSuggestions;
