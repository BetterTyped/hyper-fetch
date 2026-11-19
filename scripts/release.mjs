#!/usr/bin/env node
/* eslint-disable no-console */

// ************************************************************
// Releases every public package under one shared version.
//
//   pnpm release            run the release (CI)
//   pnpm release --dry-run  print what would happen, change nothing
//
// The order is what makes a failed release recoverable:
//
//   1. The `v*` git tag records which version is being released.
//   2. npm is the only source of truth for what is already published.
//
// Each run first finishes the latest tagged version if any package is missing from npm, and only
// then looks for a new version. Re-running the workflow is therefore always safe and is the whole
// recovery procedure. Nothing is committed: `main` is protected, and versions live in tags.
// ************************************************************

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const PUBLISH_ATTEMPTS = 3;
const RETRY_DELAY_MS = 10_000;

const CHANNELS = {
  main: { distTag: "latest", preid: undefined },
  beta: { distTag: "beta", preid: "beta" },
  alpha: { distTag: "alpha", preid: "alpha" },
};

export const channelForBranch = (branch) => {
  const channel = CHANNELS[branch];
  if (!channel) throw new Error(`Releases run from ${Object.keys(CHANNELS).join(", ")}, not "${branch}".`);
  return channel;
};

export const parseVersion = (value) => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/.exec(value);
  if (!match) return null;
  const [, major, minor, patch, preid, prerelease] = match;
  return {
    version: value.replace(/^v/, ""),
    parts: [Number(major), Number(minor), Number(patch)],
    preid,
    prerelease: prerelease === undefined ? undefined : Number(prerelease),
  };
};

export const compareVersions = (a, b) => {
  for (let i = 0; i < 3; i += 1) {
    if (a.parts[i] !== b.parts[i]) return a.parts[i] - b.parts[i];
  }
  if (a.preid === undefined || b.preid === undefined) {
    return Number(a.preid === undefined) - Number(b.preid === undefined);
  }
  return a.prerelease - b.prerelease;
};

/** The newest version already tagged on this channel. Only `v*` tags count. */
export const latestTaggedVersion = (tags, channel) =>
  tags
    .filter((tag) => tag.startsWith("v"))
    .map(parseVersion)
    .filter((parsed) => parsed && parsed.preid === channel.preid)
    .sort(compareVersions)
    .at(-1)?.version;

/** The name the docs of a major are frozen under in `documentation/versions.json`. */
export const docsVersionName = (major) => `v${major}.0.0`;

/** Nx only calculates the version, `writeVersion` writes it. */
export const nextWorkspaceVersion = async ({ preid }) => {
  const { releaseVersion } = createRequire(import.meta.url)("nx/release");
  const { workspaceVersion } = await releaseVersion({ preid, dryRun: true, verbose: false });
  return workspaceVersion ?? undefined;
};

/** Dependencies first, so a package is never on npm before the packages it needs. */
export const sortByDependencies = (packages) => {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const sorted = new Set();
  const visit = (pkg, path = []) => {
    if (sorted.has(pkg) || path.includes(pkg)) return;
    pkg.internalDependencies.forEach((name) => {
      if (byName.has(name)) visit(byName.get(name), [...path, pkg]);
    });
    sorted.add(pkg);
  };
  [...packages].sort((a, b) => a.name.localeCompare(b.name)).forEach((pkg) => visit(pkg));
  return [...sorted];
};

const planPublish = (io, packages, version) => {
  const pending = packages
    .map((pkg) => ({ pkg, versions: io.registryVersions(pkg.name) }))
    .filter(({ versions }) => !versions?.includes(version))
    .map(({ pkg, versions }) => ({ pkg, isNew: versions === null }));

  const blocked = pending.filter(({ isNew }) => isNew).map(({ pkg }) => pkg.name);
  if (blocked.length && !io.hasBootstrapToken()) {
    throw new Error(
      `${blocked.join(", ")} not on npm yet. Trusted publishing cannot create a package, so add an ` +
        "NPM_BOOTSTRAP_TOKEN secret for the first publish. Nothing was tagged or published.",
    );
  }
  return pending;
};

const publishWithRetry = async (io, { pkg, isNew }, version, channel) => {
  for (let attempt = 1; attempt <= PUBLISH_ATTEMPTS; attempt += 1) {
    try {
      io.publish(pkg, { distTag: channel.distTag, useBootstrapToken: isNew });
      return;
    } catch (error) {
      // A timed out request can still land, so ask npm before calling it a failure.
      if (io.registryVersions(pkg.name)?.includes(version)) return;
      if (attempt === PUBLISH_ATTEMPTS) throw error;
      io.log(`${pkg.name}@${version} failed (attempt ${attempt}/${PUBLISH_ATTEMPTS}), retrying.`);
      await io.sleep(RETRY_DELAY_MS * attempt);
    }
  }
};

const publishPending = async (io, pending, version, channel) => {
  const failures = [];
  // Keep going after a failure: every package that lands now is one the re-run can skip.
  for (const entry of pending) {
    try {
      await publishWithRetry(io, entry, version, channel);
      io.log(`Published ${entry.pkg.name}@${version}`);
    } catch (error) {
      failures.push(`${entry.pkg.name}: ${error.message}`);
    }
  }
  if (failures.length) {
    throw new Error(`v${version} is incomplete. Re-run this workflow to publish the rest.\n${failures.join("\n")}`);
  }
};

const ensureGithubRelease = (io, version, channel) => {
  // Versions released before this script have their notes on the `hyper-fetch-v*` tag.
  if (io.hasGithubRelease(version) || io.hasLegacyRelease(version)) return;
  io.createGithubRelease(version, { prerelease: channel.preid !== undefined });
};

/** Finishes the latest tagged version. Returns true when it had to publish something. */
const finishTaggedVersion = async (io, channel, version, { dryRun }) => {
  const head = io.head();
  // Only the packages that existed at the tag belong to it. Newer ones ship with the next version.
  const packages = io.readPackages(`v${version}`);
  const missing = planPublish(io, packages, version);
  if (!missing.length) {
    if (!dryRun) ensureGithubRelease(io, version, channel);
    return false;
  }

  io.log(`v${version} is incomplete, missing: ${missing.map(({ pkg }) => pkg.name).join(", ")}`);
  if (dryRun) return true;

  // Rebuild from the tag so the rest of the release matches what is already on npm.
  io.checkout(`v${version}`);
  io.install();
  io.writeVersion(packages, version);
  io.build();
  await publishPending(io, missing, version, channel);
  ensureGithubRelease(io, version, channel);

  io.checkout(head);
  io.install();
  return true;
};

export const runRelease = async (io, { dryRun = false } = {}) => {
  const branch = io.branch();
  const channel = channelForBranch(branch);
  io.fetchTags();

  const latest = latestTaggedVersion(io.tags(), channel);
  const finished = latest ? await finishTaggedVersion(io, channel, latest, { dryRun }) : false;
  const idle = { released: finished, version: finished ? latest : undefined };

  // A newer push has its own run queued behind this one, and that run will release it.
  if (io.head() !== io.remoteHead(branch)) {
    io.log(`${branch} moved on, leaving the new version to the latest run.`);
    return idle;
  }

  const version = await io.nextVersion({ preid: channel.preid });
  if (!version) {
    io.log("No releasable commits since the last tag.");
    return idle;
  }
  // Nx only sees tags reachable from HEAD, so a branch cut before the latest tag resolves too low.
  if (latest && compareVersions(parseVersion(version), parseVersion(latest)) <= 0) {
    throw new Error(`Next version ${version} is not newer than the latest tag v${latest}.`);
  }
  // A major replaces the docs in `documentation/docs`, so the outgoing major has to be frozen first.
  // The `Version docs` workflow commits that snapshot to the pull request with the breaking change.
  const outgoingMajor = latest ? parseVersion(latest).parts[0] : undefined;
  if (
    channel.preid === undefined &&
    outgoingMajor !== undefined &&
    parseVersion(version).parts[0] > outgoingMajor &&
    !io.docsVersions().includes(docsVersionName(outgoingMajor))
  ) {
    throw new Error(
      `v${version} replaces the v${outgoingMajor} docs, which are not versioned yet. Run ` +
        `\`pnpm docs:version --major ${outgoingMajor}\` and merge the snapshot. Nothing was tagged or published.`,
    );
  }

  const packages = io.readPackages();
  const pending = planPublish(io, packages, version);
  io.log(`Releasing v${version} (${channel.distTag}): ${packages.map((pkg) => pkg.name).join(", ")}`);
  if (dryRun) return { released: false, version };

  // Build before tagging: a broken build must not leave a tag behind.
  io.writeVersion(packages, version);
  io.build();
  io.pushTag(version);
  await publishPending(io, pending, version, channel);
  ensureGithubRelease(io, version, channel);
  return { released: true, version };
};

// ************************************************************
// Real side effects
// ************************************************************

const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe", ...options })?.trim();
const runVisible = (command, args, options = {}) => run(command, args, { stdio: "inherit", ...options });
const succeeds = (command, args) => {
  try {
    run(command, args);
    return true;
  } catch {
    return false;
  }
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

// Read once, up front: older tags have no release config to read it back from.
const excludedProjects = readJson(join(ROOT, "nx.json"))
  .release.projects.filter((pattern) => pattern.startsWith("!"))
  .map((pattern) => pattern.slice(1));

const readJsonAt = (ref, path) => {
  try {
    return JSON.parse(run("git", ["show", `${ref}:${path}`]));
  } catch {
    return undefined;
  }
};

const readPackages = (ref = "HEAD") => {
  const packages = run("git", ["ls-tree", "-d", "--name-only", ref, "packages/"])
    .split("\n")
    .filter(Boolean)
    .flatMap((directory) => {
      const manifest = readJsonAt(ref, `${directory}/package.json`);
      const project = readJsonAt(ref, `${directory}/project.json`);
      if (!manifest || excludedProjects.includes(project?.name)) return [];
      return {
        name: manifest.name,
        directory: join(ROOT, directory),
        internalDependencies: Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }),
      };
    });

  return sortByDependencies(packages);
};

const registryVersions = (name) => {
  try {
    const output = run("npm", ["view", name, "versions", "--json", "--prefer-online"]);
    return [JSON.parse(output)].flat();
  } catch (error) {
    if (`${error.stdout}${error.stderr}`.includes("E404")) return null;
    throw error;
  }
};

const realIo = {
  log: console.log,
  sleep: (ms) =>
    new Promise((done) => {
      setTimeout(done, ms);
    }),
  branch: () => process.env.GITHUB_REF_NAME ?? run("git", ["rev-parse", "--abbrev-ref", "HEAD"]),
  head: () => run("git", ["rev-parse", "HEAD"]),
  remoteHead: (branch) => run("git", ["ls-remote", "origin", `refs/heads/${branch}`]).split(/\s/)[0],
  fetchTags: () => run("git", ["fetch", "--tags", "--force", "origin"]),
  tags: () => run("git", ["tag", "--list", "v[0-9]*"]).split("\n").filter(Boolean),
  checkout: (ref) => run("git", ["checkout", "--force", "--detach", ref]),
  install: () => runVisible("pnpm", ["install", "--frozen-lockfile"]),
  build: () => runVisible("pnpm", ["build"]),
  readPackages,
  registryVersions,
  hasBootstrapToken: () => Boolean(process.env.NPM_BOOTSTRAP_TOKEN),
  writeVersion: (packages, version) => {
    packages.forEach(({ directory }) => {
      const path = join(directory, "package.json");
      writeFileSync(path, `${JSON.stringify({ ...readJson(path), version }, null, 2)}\n`);
    });
  },
  // Nx only calculates the version. Writing it here keeps the `*` ranges between our packages as
  // they are, which Nx would otherwise rewrite or reject for prereleases.
  nextVersion: nextWorkspaceVersion,
  docsVersions: () => readJson(join(ROOT, "documentation/versions.json")),
  pushTag: (version) => {
    const identity = ["-c", "user.name=github-actions[bot]"];
    identity.push("-c", "user.email=github-actions[bot]@users.noreply.github.com");
    run("git", [...identity, "tag", "-a", `v${version}`, "-m", `v${version}`]);
    run("git", ["push", "origin", `v${version}`]);
  },
  publish: ({ directory }, { distTag, useBootstrapToken }) => {
    const env = { ...process.env };
    if (useBootstrapToken) env.NODE_AUTH_TOKEN = process.env.NPM_BOOTSTRAP_TOKEN;
    runVisible("npm", ["publish", "--access", "public", "--tag", distTag], { cwd: directory, env });
  },
  hasGithubRelease: (version) => succeeds("gh", ["release", "view", `v${version}`]),
  hasLegacyRelease: (version) => succeeds("gh", ["release", "view", `hyper-fetch-v${version}`]),
  createGithubRelease: (version, { prerelease }) => {
    const args = ["release", "create", `v${version}`, "--title", `v${version}`];
    args.push("--generate-notes", "--verify-tag", prerelease ? "--prerelease" : "--latest");
    runVisible("gh", args);
  },
};

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  runRelease(realIo, { dryRun: process.argv.includes("--dry-run") })
    .then(({ released, version }) => {
      if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `released=${released}\nversion=${version ?? ""}\n`);
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
