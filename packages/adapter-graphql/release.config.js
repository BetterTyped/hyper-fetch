// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../../release.config");

const newConfig = { ...config, publish: undefined, success: undefined, fail: undefined };

module.exports = newConfig;
