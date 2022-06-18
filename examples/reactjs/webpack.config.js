/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
const nxReactBaseConfig = require("@nrwl/react/plugins/webpack");
const { merge } = require("webpack-merge");
const path = require("path");

module.exports = function (webpackConfig, nxConfig) {
  // Fix that Nx uses a different attribute when serving the app
  nxConfig.options = nxConfig.options || nxConfig.buildOptions;
  const config = nxReactBaseConfig(webpackConfig);

  const mergeWebpackConfigs = [
    config,
    {
      devServer: {
        static: {
          directory: path.resolve(__dirname, "public"),
        },
      },
    },
  ];

  return merge(mergeWebpackConfigs);
};
