import type { Plugin } from "@oxlint/plugins";

import { clientGenericTypes } from "./rules/client-generic-types";
import { requestGenericTypes } from "./rules/request-generic-types";

export { clientGenericTypes } from "./rules/client-generic-types";
export { requestGenericTypes } from "./rules/request-generic-types";

/**
 * Oxlint JS plugin with the HyperFetch rules. Rules are exposed as `hyper-fetch/<rule>`.
 *
 * @example
 * ```json
 * {
 *   "jsPlugins": ["oxlint-plugin-hyper-fetch"],
 *   "rules": {
 *     "hyper-fetch/client-generic-types": "error",
 *     "hyper-fetch/request-generic-types": "error"
 *   }
 * }
 * ```
 */
const plugin: Plugin = {
  meta: { name: "hyper-fetch" },
  rules: {
    "client-generic-types": clientGenericTypes,
    "request-generic-types": requestGenericTypes,
  },
};

// oxlint loads a JS plugin from its default export.
// oxlint-disable-next-line import/no-default-export
export default plugin;
