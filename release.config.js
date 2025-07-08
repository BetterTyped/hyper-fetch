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
};
