import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  channelForBranch,
  compareVersions,
  latestTaggedVersion,
  parseVersion,
  runRelease,
  sortByDependencies,
} from "./release.mjs";

const pkg = (name, internalDependencies = []) => ({ name, directory: `/${name}`, internalDependencies });
const PACKAGES = [pkg("@hyper-fetch/react", ["@hyper-fetch/core"]), pkg("@hyper-fetch/core")];

/** In-memory registry, git and GitHub. `calls` records every side effect in order. */
const createIo = ({
  branch = "main",
  tags = ["v1.0.0"],
  registry = { "@hyper-fetch/core": ["1.0.0"], "@hyper-fetch/react": ["1.0.0"] },
  next = "1.1.0",
  remoteHead = "sha",
  packages = PACKAGES,
  taggedPackages = PACKAGES,
  failures = {},
  bootstrapToken = false,
  githubReleases = ["1.0.0"],
  legacyReleases = [],
  docsVersions = [],
} = {}) => {
  const calls = [];
  const remaining = { ...failures };
  const state = { tags: [...tags], registry: structuredClone(registry) };
  return {
    calls,
    state,
    log: () => {},
    sleep: async () => {},
    branch: () => branch,
    head: () => "sha",
    remoteHead: () => remoteHead,
    fetchTags: () => {},
    tags: () => state.tags,
    checkout: (ref) => calls.push(`checkout:${ref}`),
    install: () => calls.push("install"),
    build: () => calls.push("build"),
    readPackages: (ref) => (ref ? taggedPackages : packages),
    registryVersions: (name) => state.registry[name] ?? null,
    hasBootstrapToken: () => bootstrapToken,
    writeVersion: (_, version) => calls.push(`write:${version}`),
    nextVersion: async (options) => {
      calls.push(`next:${options.preid ?? "stable"}`);
      return next;
    },
    pushTag: (version) => {
      state.tags.push(`v${version}`);
      calls.push(`tag:${version}`);
    },
    publish: ({ name }, { distTag, useBootstrapToken }) => {
      if (remaining[name] > 0) {
        remaining[name] -= 1;
        throw new Error(`${name} failed`);
      }
      const version = next && state.tags.includes(`v${next}`) ? next : state.tags.at(-1).slice(1);
      state.registry[name] = [...(state.registry[name] ?? []), version];
      calls.push(`publish:${name}:${distTag}${useBootstrapToken ? ":bootstrap" : ""}`);
    },
    hasGithubRelease: (version) => githubReleases.includes(version),
    hasLegacyRelease: (version) => legacyReleases.includes(version),
    createGithubRelease: (version, { prerelease }) => calls.push(`github:${version}${prerelease ? ":prerelease" : ""}`),
    docsVersions: () => docsVersions,
  };
};

describe("versions", () => {
  it("orders prereleases before their stable version", () => {
    const sorted = ["1.0.0", "1.0.0-beta.2", "1.0.0-beta.10", "0.9.9"]
      .map(parseVersion)
      .sort(compareVersions)
      .map(({ version }) => version);
    assert.deepEqual(sorted, ["0.9.9", "1.0.0-beta.2", "1.0.0-beta.10", "1.0.0"]);
  });

  it("reads the latest tag of the channel and ignores per-package tags", () => {
    const tags = ["v9.5.0", "v9.10.0", "v10.0.0-beta.1", "hyper-fetch-v11.0.0", "vnext"];
    assert.equal(latestTaggedVersion(tags, channelForBranch("main")), "9.10.0");
    assert.equal(latestTaggedVersion(tags, channelForBranch("beta")), "10.0.0-beta.1");
    assert.equal(latestTaggedVersion(tags, channelForBranch("alpha")), undefined);
  });

  it("refuses to release from any other branch", () => {
    assert.throws(() => channelForBranch("feature"), /not "feature"/);
  });
});

describe("sortByDependencies", () => {
  it("puts dependencies first and survives cycles", () => {
    const names = sortByDependencies([pkg("a", ["b"]), pkg("b", ["c"]), pkg("c", ["a"]), pkg("d")]).map(
      ({ name }) => name,
    );
    assert.deepEqual(names, ["c", "b", "a", "d"]);
  });
});

describe("runRelease", () => {
  it("does nothing without releasable commits", async () => {
    const io = createIo({ next: null });
    assert.deepEqual(await runRelease(io), { released: false, version: undefined });
    assert.deepEqual(io.calls, ["next:stable"]);
  });

  it("builds, tags, publishes every package, then creates the GitHub release", async () => {
    const io = createIo();
    assert.deepEqual(await runRelease(io), { released: true, version: "1.1.0" });
    assert.deepEqual(io.calls, [
      "next:stable",
      "write:1.1.0",
      "build",
      "tag:1.1.0",
      "publish:@hyper-fetch/react:latest",
      "publish:@hyper-fetch/core:latest",
      "github:1.1.0",
    ]);
  });

  it("does not tag when the build fails", async () => {
    const io = createIo();
    io.build = () => {
      throw new Error("build failed");
    };
    await assert.rejects(runRelease(io), /build failed/);
    assert.deepEqual(io.state.tags, ["v1.0.0"]);
  });

  it("publishes the remaining packages after one fails, and skips the GitHub release", async () => {
    const io = createIo({ failures: { "@hyper-fetch/react": 3 } });
    await assert.rejects(runRelease(io), /v1\.1\.0 is incomplete[\s\S]*@hyper-fetch\/react/);
    assert.ok(io.calls.includes("publish:@hyper-fetch/core:latest"));
    assert.ok(io.state.tags.includes("v1.1.0"));
    assert.ok(!io.calls.some((call) => call.startsWith("github:")));
  });

  it("retries a failed publish", async () => {
    const io = createIo({ failures: { "@hyper-fetch/core": 2 } });
    assert.equal((await runRelease(io)).released, true);
  });

  it("treats a failed publish that reached npm as published", async () => {
    const io = createIo();
    io.publish = ({ name }) => {
      io.state.registry[name].push("1.1.0");
      throw new Error("socket hang up");
    };
    assert.equal((await runRelease(io)).released, true);
    assert.ok(io.calls.includes("github:1.1.0"));
  });

  it("finishes a half released version from its tag, publishing only what is missing", async () => {
    const io = createIo({
      tags: ["v1.0.0", "v1.1.0"],
      registry: { "@hyper-fetch/core": ["1.1.0"], "@hyper-fetch/react": ["1.0.0"] },
      next: null,
    });
    assert.deepEqual(await runRelease(io), { released: true, version: "1.1.0" });
    assert.deepEqual(io.calls, [
      "checkout:v1.1.0",
      "install",
      "write:1.1.0",
      "build",
      "publish:@hyper-fetch/react:latest",
      "github:1.1.0",
      "checkout:sha",
      "install",
      "next:stable",
    ]);
  });

  it("finishes the old version and still releases new commits in the same run", async () => {
    const io = createIo({
      tags: ["v1.0.0", "v1.1.0"],
      registry: { "@hyper-fetch/core": ["1.1.0"], "@hyper-fetch/react": ["1.0.0"] },
      next: "1.2.0",
    });
    assert.deepEqual(await runRelease(io), { released: true, version: "1.2.0" });
    assert.ok(io.state.tags.includes("v1.2.0"));
  });

  it("creates a GitHub release that a previous run did not reach", async () => {
    const io = createIo({ githubReleases: [], next: null });
    await runRelease(io);
    assert.deepEqual(io.calls, ["github:1.0.0", "next:stable"]);
  });

  it("does not duplicate the notes of versions released before this script", async () => {
    const io = createIo({ githubReleases: [], legacyReleases: ["1.0.0"], next: null });
    await runRelease(io);
    assert.deepEqual(io.calls, ["next:stable"]);
  });

  it("finishes a broken release on a stale run but leaves new versions to the newest run", async () => {
    const io = createIo({
      tags: ["v1.0.0", "v1.1.0"],
      registry: { "@hyper-fetch/core": ["1.1.0"], "@hyper-fetch/react": ["1.0.0"] },
      remoteHead: "newer",
    });
    assert.deepEqual(await runRelease(io), { released: true, version: "1.1.0" });
    assert.ok(!io.calls.includes("next:stable"));
  });

  it("never releases a version older than the latest tag", async () => {
    const io = createIo({ tags: ["v1.0.0", "v9.5.0"], next: "9.4.3", githubReleases: ["9.5.0"] });
    io.state.registry["@hyper-fetch/core"].push("9.5.0");
    io.state.registry["@hyper-fetch/react"].push("9.5.0");
    await assert.rejects(runRelease(io), /9\.4\.3 is not newer than the latest tag v9\.5\.0/);
    assert.ok(!io.calls.includes("build"));
  });

  it("does not treat a package added after the latest tag as missing from that tag", async () => {
    const io = createIo({ packages: [...PACKAGES, pkg("@hyper-fetch/new")], bootstrapToken: true, next: null });
    assert.deepEqual(await runRelease(io), { released: false, version: undefined });
    assert.deepEqual(io.calls, ["next:stable"]);
  });

  it("stops before tagging when a new package cannot be published", async () => {
    const io = createIo({ packages: [...PACKAGES, pkg("@hyper-fetch/new")] });
    await assert.rejects(runRelease(io), /@hyper-fetch\/new not on npm yet.*NPM_BOOTSTRAP_TOKEN/);
    assert.deepEqual(io.state.tags, ["v1.0.0"]);
    assert.ok(!io.calls.includes("build"));
  });

  it("publishes a new package with the bootstrap token and no manual tag", async () => {
    const io = createIo({ bootstrapToken: true, packages: [...PACKAGES, pkg("@hyper-fetch/new")] });
    await runRelease(io);
    assert.ok(io.calls.includes("publish:@hyper-fetch/new:latest:bootstrap"));
    assert.ok(io.calls.includes("publish:@hyper-fetch/core:latest"));
  });

  it("publishes prereleases to their own dist-tag", async () => {
    const io = createIo({
      branch: "beta",
      tags: ["v1.0.0", "v1.1.0-beta.0"],
      registry: { "@hyper-fetch/core": ["1.1.0-beta.0"], "@hyper-fetch/react": ["1.1.0-beta.0"] },
      githubReleases: ["1.1.0-beta.0"],
      next: "1.1.0-beta.1",
    });
    await runRelease(io);
    assert.ok(io.calls.includes("next:beta"));
    assert.ok(io.calls.includes("publish:@hyper-fetch/core:beta"));
    assert.ok(io.calls.includes("github:1.1.0-beta.1:prerelease"));
  });

  it("refuses a major before the outgoing docs are versioned", async () => {
    const io = createIo({ next: "2.0.0", docsVersions: ["v0.0.0"] });
    await assert.rejects(runRelease(io), /v1 docs, which are not versioned yet.*docs:version --major 1/);
    assert.deepEqual(io.state.tags, ["v1.0.0"]);
    assert.ok(!io.calls.includes("build"));
  });

  it("releases a major once the outgoing docs are versioned", async () => {
    const io = createIo({ next: "2.0.0", docsVersions: ["v1.0.0"] });
    assert.deepEqual(await runRelease(io), { released: true, version: "2.0.0" });
  });

  it("does not wait for versioned docs on a prerelease major", async () => {
    const io = createIo({
      branch: "beta",
      tags: ["v1.0.0", "v1.1.0-beta.0"],
      registry: { "@hyper-fetch/core": ["1.1.0-beta.0"], "@hyper-fetch/react": ["1.1.0-beta.0"] },
      githubReleases: ["1.1.0-beta.0"],
      next: "2.0.0-beta.0",
    });
    assert.equal((await runRelease(io)).released, true);
  });

  it("changes nothing on a dry run", async () => {
    const io = createIo({
      tags: ["v1.0.0", "v1.1.0"],
      registry: { "@hyper-fetch/core": ["1.1.0"], "@hyper-fetch/react": ["1.0.0"] },
      next: "1.2.0",
    });
    assert.deepEqual(await runRelease(io, { dryRun: true }), { released: false, version: "1.2.0" });
    assert.deepEqual(io.calls, ["next:stable"]);
    assert.deepEqual(io.state.tags, ["v1.0.0", "v1.1.0"]);
  });
});
