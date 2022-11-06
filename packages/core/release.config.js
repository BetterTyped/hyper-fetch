// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../../release.config");

const newConfig = { ...config, publish: undefined, success: undefined, fail: undefined };
// newConfig.release.plugins.pop();
// // We want to publish only single release notes
// newConfig.release.plugins.push([
//   "@semantic-release/github",
//   {
//     publish: true,
//   },
// ]);

module.exports = newConfig;
