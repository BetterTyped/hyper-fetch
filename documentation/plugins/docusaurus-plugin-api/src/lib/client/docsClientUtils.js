"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocVersionSuggestions = exports.getActiveDocContext = exports.getActiveVersion = exports.getLatestVersion = exports.getActivePlugin = void 0;
const router_1 = require("@docusaurus/router");
// This code is not part of the api surface, not in ./theme on purpose
// get the data of the plugin that is currently "active"
// ie the docs of that plugin are currently browsed
// it is useful to support multiple docs plugin instances
function getActivePlugin(allPluginData, pathname, options = {}) {
    const activeEntry = Object.entries(allPluginData)
        // Route sorting: '/android/foo' should match '/android' instead of '/'
        .sort((a, b) => b[1].path.localeCompare(a[1].path))
        .find(([, pluginData]) => !!(0, router_1.matchPath)(pathname, {
        path: pluginData.path,
        exact: false,
        strict: false,
    }));
    const activePlugin = activeEntry
        ? { pluginId: activeEntry[0], pluginData: activeEntry[1] }
        : undefined;
    if (!activePlugin && options.failfast) {
        throw new Error(`Can't find active docs plugin for "${pathname}" pathname, while it was expected to be found. Maybe you tried to use a docs feature that can only be used on a docs-related page? Existing docs plugin paths are: ${Object.values(allPluginData)
            .map((plugin) => plugin.path)
            .join(', ')}`);
    }
    return activePlugin;
}
exports.getActivePlugin = getActivePlugin;
const getLatestVersion = (data) => data.versions.find((version) => version.isLast);
exports.getLatestVersion = getLatestVersion;
function getActiveVersion(data, pathname) {
    const lastVersion = (0, exports.getLatestVersion)(data);
    // Last version is a route like /docs/*,
    // we need to match it last or it would match /docs/version-1.0/* as well
    const orderedVersionsMetadata = [
        ...data.versions.filter((version) => version !== lastVersion),
        lastVersion,
    ];
    return orderedVersionsMetadata.find((version) => !!(0, router_1.matchPath)(pathname, {
        path: version.path,
        exact: false,
        strict: false,
    }));
}
exports.getActiveVersion = getActiveVersion;
function getActiveDocContext(data, pathname) {
    const activeVersion = getActiveVersion(data, pathname);
    const activeDoc = activeVersion?.docs.find((doc) => !!(0, router_1.matchPath)(pathname, {
        path: doc.path,
        exact: true,
        strict: false,
    }));
    function getAlternateVersionDocs(docId) {
        const result = {};
        data.versions.forEach((version) => {
            version.docs.forEach((doc) => {
                if (doc.id === docId) {
                    result[version.name] = doc;
                }
            });
        });
        return result;
    }
    const alternateVersionDocs = activeDoc
        ? getAlternateVersionDocs(activeDoc.id)
        : {};
    return {
        activeVersion,
        activeDoc,
        alternateDocVersions: alternateVersionDocs,
    };
}
exports.getActiveDocContext = getActiveDocContext;
function getDocVersionSuggestions(data, pathname) {
    const latestVersion = (0, exports.getLatestVersion)(data);
    const activeDocContext = getActiveDocContext(data, pathname);
    const latestDocSuggestion = activeDocContext?.alternateDocVersions[latestVersion.name];
    return { latestDocSuggestion, latestVersionSuggestion: latestVersion };
}
exports.getDocVersionSuggestions = getDocVersionSuggestions;
