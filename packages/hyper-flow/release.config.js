/**
 * @type {import("semantic-release").Config}
 */
module.exports = {
  publish: undefined,
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
              release: "minor",
            },
            {
              type: "*",
              release: "patch",
            },
          ],
        },
      ],
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/git",
        {
          assets: ["package.json"],
          message: "🤖 chore: ${nextRelease.version} [skip ci]",
        },
      ],
      "@semantic-release/github",
    ],
  },
};
