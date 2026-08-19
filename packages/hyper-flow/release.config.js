module.exports = {
  publish: false,
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
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    // npmPublish: false also skips the npm auth check. HyperFlow is not published to npm,
    // and without a token (publishing goes through OIDC now) the default verify step fails.
    ["@semantic-release/npm", { npmPublish: false }],
    "@semantic-release/github",
  ],
};
