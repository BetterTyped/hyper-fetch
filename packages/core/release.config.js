// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../../release.config");

// We want to publish only single release notes
const newConfig = { ...config, publish: undefined, success: undefined, fail: undefined };
newConfig.release.plugins.push(["@semantic-release/git"]);

module.exports = newConfig;
