module.exports = {
  // We want to publish only single release notes for the core package release config
  publish: "@semantic-release/npm",
  success: false,
  fail: false,

  branches: [
    {
      name: "main",
    },
    {
      name: "beta",
      prerelease: true,
    },
    {
      name: "alpha",
      prerelease: true,
    },
  ],
  release: {
    plugins: [
      [
        "@semantic-release/commit-analyzer",
        {
          releaseRules: [
            {
              scope: "no-release",
              release: false,
            },
            {
              breaking: true,
              release: "major",
            },
            {
              type: "feat",
              release: "minor",
            },
            {
              type: "refactor",
              scope: "core-*",
              release: "minor",
            },
            {
              type: "*",
              release: "patch",
            },
          ],
        },
        [
          "@semantic-release/exec",
          {
            publishCmd:
              "yarn run docusaurus docs:version ${nextRelease.version} && yarn run docusaurus docs:version:api ${nextRelease.version} && yarn run docusaurus docs:version:guides ${nextRelease.version}",
          },
        ],
      ],
      "@semantic-release/npm",
      "@semantic-release/github",
    ],
    prepare: [
      "@semantic-release/changelog",
      {
        path: "@semantic-release/git",
        message: "Docs version: ${nextRelease.version}",
      },
      "@semantic-release/npm",
    ],
    publish: ["@semantic-release/npm", "@semantic-release/github"],
  },
};
