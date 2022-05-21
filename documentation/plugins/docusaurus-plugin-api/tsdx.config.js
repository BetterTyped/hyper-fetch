const copy = require("rollup-plugin-copy");

module.exports = {
  rollup(config) {
    config.plugins.push(
      copy({
        targets: [{ src: "src/lib", dest: "dist/" }],
        copyOnce: true,
        overwrite: true,
        hook: "writeBundle",
      }),
    );
    return config;
  },
};
