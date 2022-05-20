"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.postProcessSidebars = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("@docusaurus/utils");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
function normalizeCategoryLink(category, params) {
    if (category.link?.type === 'generated-index') {
        // Default slug logic can be improved
        const getDefaultSlug = () => `/category/${params.categoryLabelSlugger.slug(category.label)}`;
        const slug = category.link.slug ?? getDefaultSlug();
        const permalink = (0, utils_1.normalizeUrl)([params.version.path, slug]);
        return {
            ...category.link,
            slug,
            permalink,
        };
    }
    return category.link;
}
function postProcessSidebarItem(item, params) {
    if (item.type === 'category') {
        const category = {
            ...item,
            collapsed: item.collapsed ?? params.sidebarOptions.sidebarCollapsed,
            collapsible: item.collapsible ?? params.sidebarOptions.sidebarCollapsible,
            link: normalizeCategoryLink(item, params),
            items: item.items.map((subItem) => postProcessSidebarItem(subItem, params)),
        };
        // If the current category doesn't have subitems, we render a normal link
        // instead.
        if (category.items.length === 0) {
            if (!category.link) {
                throw new Error(`Sidebar category ${item.label} has neither any subitem nor a link. This makes this item not able to link to anything.`);
            }
            return category.link.type === 'doc'
                ? {
                    type: 'doc',
                    label: category.label,
                    id: category.link.id,
                }
                : {
                    type: 'link',
                    label: category.label,
                    href: category.link.permalink,
                };
        }
        // A non-collapsible category can't be collapsed!
        if (category.collapsible === false) {
            category.collapsed = false;
        }
        return category;
    }
    return item;
}
function postProcessSidebars(sidebars, params) {
    return lodash_1.default.mapValues(sidebars, (sidebar) => sidebar.map((item) => postProcessSidebarItem(item, params)));
}
exports.postProcessSidebars = postProcessSidebars;
