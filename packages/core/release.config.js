// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../../release.config");
/**
 * @type {import("semantic-release").Config}
 */
const newConfig = { ...config, publish: undefined, success: undefined, fail: undefined };

module.exports = newConfig;
