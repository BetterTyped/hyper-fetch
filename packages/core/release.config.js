// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../../release.config");

config.release.plugins.push(["@semantic-release/git"]);

module.exports = config;
