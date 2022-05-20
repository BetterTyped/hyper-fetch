"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptions = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("@docusaurus/utils");
const sidebars_1 = require("./sidebars");
const generator_1 = require("./sidebars/generator");
const docs_1 = require("./docs");
const versions_1 = require("./versions");
const cli_1 = require("./cli");
const constants_1 = require("./constants");
const globalData_1 = require("./globalData");
const props_1 = require("./props");
const categoryGeneratedIndex_1 = require("./categoryGeneratedIndex");
const translations_1 = require("./translations");
const logger_1 = tslib_1.__importDefault(require("@docusaurus/logger"));
const tags_1 = require("./tags");
const routes_1 = require("./routes");
const utils_2 = require("./sidebars/utils");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
async function pluginContentDocs(context, options) {
    const { siteDir, generatedFilesDir, baseUrl, siteConfig } = context;
    // Mutate options to resolve sidebar path according to siteDir
    options.sidebarPath = (0, sidebars_1.resolveSidebarPathOption)(siteDir, options.sidebarPath);
    const versionsMetadata = await (0, versions_1.readVersionsMetadata)({ context, options });
    const pluginId = options.id;
    const pluginDataDirRoot = path_1.default.join(generatedFilesDir, 'docusaurus-plugin-content-docs');
    const dataDir = path_1.default.join(pluginDataDirRoot, pluginId);
    const aliasedSource = (source) => `~docs/${(0, utils_1.posixPath)(path_1.default.relative(pluginDataDirRoot, source))}`;
    return {
        name: 'docusaurus-plugin-content-docs',
        extendCli(cli) {
            const isDefaultPluginId = pluginId === utils_1.DEFAULT_PLUGIN_ID;
            // Need to create one distinct command per plugin instance
            // otherwise 2 instances would try to execute the command!
            const command = isDefaultPluginId
                ? 'docs:version'
                : `docs:version:${pluginId}`;
            const commandDescription = isDefaultPluginId
                ? 'Tag a new docs version'
                : `Tag a new docs version (${pluginId})`;
            cli
                .command(command)
                .arguments('<version>')
                .description(commandDescription)
                .action((version) => {
                (0, cli_1.cliDocsVersionCommand)(version, options, context);
            });
        },
        getTranslationFiles({ content }) {
            return (0, translations_1.getLoadedContentTranslationFiles)(content);
        },
        getPathsToWatch() {
            function getVersionPathsToWatch(version) {
                const result = [
                    ...options.include.flatMap((pattern) => (0, utils_1.getContentPathList)(version).map((docsDirPath) => `${docsDirPath}/${pattern}`)),
                    `${version.contentPath}/**/${generator_1.CategoryMetadataFilenamePattern}`,
                ];
                if (typeof version.sidebarFilePath === 'string') {
                    result.unshift(version.sidebarFilePath);
                }
                return result;
            }
            return versionsMetadata.flatMap(getVersionPathsToWatch);
        },
        async loadContent() {
            async function loadVersionDocsBase(versionMetadata) {
                const docFiles = await (0, docs_1.readVersionDocs)(versionMetadata, options);
                if (docFiles.length === 0) {
                    throw new Error(`Docs version "${versionMetadata.versionName}" has no docs! At least one doc should exist at "${path_1.default.relative(siteDir, versionMetadata.contentPath)}".`);
                }
                async function processVersionDoc(docFile) {
                    return (0, docs_1.processDocMetadata)({
                        docFile,
                        versionMetadata,
                        context,
                        options,
                        env: process.env.NODE_ENV,
                    });
                }
                return Promise.all(docFiles.map(processVersionDoc));
            }
            async function doLoadVersion(versionMetadata) {
                const docsBase = await loadVersionDocsBase(versionMetadata);
                const [drafts, docs] = lodash_1.default.partition(docsBase, (doc) => doc.draft);
                const sidebars = await (0, sidebars_1.loadSidebars)(versionMetadata.sidebarFilePath, {
                    sidebarItemsGenerator: options.sidebarItemsGenerator,
                    numberPrefixParser: options.numberPrefixParser,
                    docs,
                    drafts,
                    version: versionMetadata,
                    sidebarOptions: {
                        sidebarCollapsed: options.sidebarCollapsed,
                        sidebarCollapsible: options.sidebarCollapsible,
                    },
                    categoryLabelSlugger: (0, utils_1.createSlugger)(),
                });
                const sidebarsUtils = (0, utils_2.createSidebarsUtils)(sidebars);
                return {
                    ...versionMetadata,
                    docs: (0, docs_1.addDocNavigation)(docs, sidebarsUtils, versionMetadata.sidebarFilePath),
                    drafts,
                    sidebars,
                };
            }
            async function loadVersion(versionMetadata) {
                try {
                    return await doLoadVersion(versionMetadata);
                }
                catch (err) {
                    logger_1.default.error `Loading of version failed for version name=${versionMetadata.versionName}`;
                    throw err;
                }
            }
            return {
                loadedVersions: await Promise.all(versionsMetadata.map(loadVersion)),
            };
        },
        translateContent({ content, translationFiles }) {
            return (0, translations_1.translateLoadedContent)(content, translationFiles);
        },
        async contentLoaded({ content, actions }) {
            const { loadedVersions } = content;
            const { docLayoutComponent, docItemComponent, docCategoryGeneratedIndexComponent, breadcrumbs, } = options;
            const { addRoute, createData, setGlobalData } = actions;
            const versions = loadedVersions.map((version) => {
                const sidebarsUtils = (0, utils_2.createSidebarsUtils)(version.sidebars);
                return {
                    ...version,
                    sidebarsUtils,
                    categoryGeneratedIndices: (0, categoryGeneratedIndex_1.getCategoryGeneratedIndexMetadataList)({
                        docs: version.docs,
                        sidebarsUtils,
                    }),
                };
            });
            async function createVersionTagsRoutes(version) {
                const versionTags = (0, tags_1.getVersionTags)(version.docs);
                // TODO tags should be a sub route of the version route
                async function createTagsListPage() {
                    const tagsProp = Object.values(versionTags).map((tagValue) => ({
                        label: tagValue.label,
                        permalink: tagValue.permalink,
                        count: tagValue.docIds.length,
                    }));
                    // Only create /tags page if there are tags.
                    if (tagsProp.length > 0) {
                        const tagsPropPath = await createData(`${(0, utils_1.docuHash)(`tags-list-${version.versionName}-prop`)}.json`, JSON.stringify(tagsProp, null, 2));
                        addRoute({
                            path: version.tagsPath,
                            exact: true,
                            component: options.docTagsListComponent,
                            modules: {
                                tags: aliasedSource(tagsPropPath),
                            },
                        });
                    }
                }
                // TODO tags should be a sub route of the version route
                async function createTagDocListPage(tag) {
                    const tagProps = (0, props_1.toTagDocListProp)({
                        allTagsPath: version.tagsPath,
                        tag,
                        docs: version.docs,
                    });
                    const tagPropPath = await createData(`${(0, utils_1.docuHash)(`tag-${tag.permalink}`)}.json`, JSON.stringify(tagProps, null, 2));
                    addRoute({
                        path: tag.permalink,
                        component: options.docTagDocListComponent,
                        exact: true,
                        modules: {
                            tag: aliasedSource(tagPropPath),
                        },
                    });
                }
                await createTagsListPage();
                await Promise.all(Object.values(versionTags).map(createTagDocListPage));
            }
            await Promise.all(versions.map((version) => (0, routes_1.createVersionRoutes)({
                version,
                docItemComponent,
                docLayoutComponent,
                docCategoryGeneratedIndexComponent,
                pluginId,
                aliasedSource,
                actions,
            })));
            // TODO tags should be a sub route of the version route
            await Promise.all(versions.map(createVersionTagsRoutes));
            setGlobalData({
                path: (0, utils_1.normalizeUrl)([baseUrl, options.routeBasePath]),
                versions: versions.map(globalData_1.toGlobalDataVersion),
                breadcrumbs,
            });
        },
        configureWebpack(_config, isServer, utils, content) {
            const { getJSLoader } = utils;
            const { rehypePlugins, remarkPlugins, beforeDefaultRehypePlugins, beforeDefaultRemarkPlugins, } = options;
            function getSourceToPermalink() {
                const allDocs = content.loadedVersions.flatMap((v) => v.docs);
                return Object.fromEntries(allDocs.map(({ source, permalink }) => [source, permalink]));
            }
            const docsMarkdownOptions = {
                siteDir,
                sourceToPermalink: getSourceToPermalink(),
                versionsMetadata,
                onBrokenMarkdownLink: (brokenMarkdownLink) => {
                    if (siteConfig.onBrokenMarkdownLinks === 'ignore') {
                        return;
                    }
                    (0, utils_1.reportMessage)(`Docs markdown link couldn't be resolved: (${brokenMarkdownLink.link}) in ${brokenMarkdownLink.filePath} for version ${brokenMarkdownLink.contentPaths.versionName}`, siteConfig.onBrokenMarkdownLinks);
                },
            };
            function createMDXLoaderRule() {
                const contentDirs = versionsMetadata.flatMap(utils_1.getContentPathList);
                return {
                    test: /\.mdx?$/i,
                    include: contentDirs
                        // Trailing slash is important, see https://github.com/facebook/docusaurus/pull/3970
                        .map(utils_1.addTrailingPathSeparator),
                    use: [
                        getJSLoader({ isServer }),
                        {
                            loader: require.resolve('@docusaurus/mdx-loader'),
                            options: {
                                remarkPlugins,
                                rehypePlugins,
                                beforeDefaultRehypePlugins,
                                beforeDefaultRemarkPlugins,
                                staticDirs: siteConfig.staticDirectories.map((dir) => path_1.default.resolve(siteDir, dir)),
                                siteDir,
                                isMDXPartial: (0, utils_1.createAbsoluteFilePathMatcher)(options.exclude, contentDirs),
                                metadataPath: (mdxPath) => {
                                    // Note that metadataPath must be the same/in-sync as
                                    // the path from createData for each MDX.
                                    const aliasedPath = (0, utils_1.aliasedSitePath)(mdxPath, siteDir);
                                    return path_1.default.join(dataDir, `${(0, utils_1.docuHash)(aliasedPath)}.json`);
                                },
                                // Assets allow to convert some relative images paths to
                                // require(...) calls
                                createAssets: ({ frontMatter, }) => ({
                                    image: frontMatter.image,
                                }),
                            },
                        },
                        {
                            loader: path_1.default.resolve(__dirname, './markdown/index.js'),
                            options: docsMarkdownOptions,
                        },
                    ].filter(Boolean),
                };
            }
            return {
                ignoreWarnings: [
                    // Suppress warnings about non-existing of versions file.
                    (e) => e.message.includes("Can't resolve") &&
                        e.message.includes(constants_1.VERSIONS_JSON_FILE),
                ],
                resolve: {
                    alias: {
                        '~docs': pluginDataDirRoot,
                    },
                },
                module: {
                    rules: [createMDXLoaderRule()],
                },
            };
        },
    };
}
exports.default = pluginContentDocs;
var options_1 = require("./options");
Object.defineProperty(exports, "validateOptions", { enumerable: true, get: function () { return options_1.validateOptions; } });
