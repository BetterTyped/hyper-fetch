#!/usr/bin/env node
/* eslint-disable no-console */

// ************************************************************
// Freezes the docs of a finished major, so the site keeps serving them next to the new major.
//
//   pnpm docs:version              freeze the current major if the next release is a major
//   pnpm docs:version --check      only report the major that needs freezing, change nothing
//   pnpm docs:version --major 8    freeze v8 now, whatever the next release is
//
// A major release replaces the docs in `documentation/docs`. The outgoing docs are rebuilt from the
// last tag of their major in a temporary worktree, so the snapshot holds exactly what that version
// shipped with, API reference included. Docusaurus then serves it from `versioned_docs`, and the
// current docs take the next major as their label (`getVersions` in docusaurus.config.ts).
//
// The site builds the current docs and the newest `BUILT_DOCS_VERSIONS` frozen majors. Freezing a
// major takes the oldest one out of `versions.json`, which is all Docusaurus reads. Its snapshot
// stays in `versioned_docs`, so it can go back into the build by adding it to the list again.
//
// The `Version docs` workflow runs this on every pull request to main and commits the snapshot to
// the pull request that brings the breaking change. The release refuses a major without it.
// ************************************************************

import { execFileSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  channelForBranch,
  compareVersions,
  docsVersionName,
  latestTaggedVersion,
  nextWorkspaceVersion,
  parseVersion,
} from "./release.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const DOCS = join(ROOT, "documentation");
const STABLE = channelForBranch("main");

const majorOf = (version) => parseVersion(version).parts[0];

/** The newest stable tag of a major: the docs that major ended with. */
export const lastTagOfMajor = (tags, major) =>
  tags
    .filter((tag) => tag.startsWith("v"))
    .map(parseVersion)
    .filter((parsed) => parsed && parsed.preid === undefined && parsed.parts[0] === major)
    .sort(compareVersions)
    .at(-1)?.version;

/** The major whose docs `next` replaces, or undefined when `next` is not a new major. */
export const outgoingMajor = (tags, next) => {
  const latest = latestTaggedVersion(tags, STABLE);
  if (!latest || !next) return undefined;
  return majorOf(next) > majorOf(latest) ? majorOf(latest) : undefined;
};

/** How many frozen majors the site builds next to the current docs. */
export const BUILT_DOCS_VERSIONS = 2;

/** Newest first, the order Docusaurus reads `versions.json` in. */
export const sortDocsVersions = (versions) =>
  [...new Set(versions)].sort((a, b) => compareVersions(parseVersion(b), parseVersion(a)));

/** Returns the frozen major, or undefined when nothing needed freezing. */
export const runDocsVersion = async (io, { major, check = false } = {}) => {
  io.fetchTags();
  const tags = io.tags();
  const target = major ?? outgoingMajor(tags, await io.nextVersion());
  if (target === undefined) {
    io.log("The next release is not a major, so no docs need versioning.");
    return undefined;
  }

  const name = docsVersionName(target);
  const versions = io.readVersions();
  if (versions.includes(name)) {
    io.log(`The ${name} docs are already versioned.`);
    return undefined;
  }

  const tag = lastTagOfMajor(tags, target);
  if (!tag) throw new Error(`There is no v${target}.x.y tag to build the ${name} docs from.`);
  io.log(`The ${name} docs ${check ? "need" : "get"} versioning from v${tag}.`);
  if (check) return target;

  io.snapshot(`v${tag}`, name);
  const sorted = sortDocsVersions([name, ...versions]);
  const built = sorted.slice(0, BUILT_DOCS_VERSIONS);
  io.writeVersions(built);
  io.log(`Versioned the ${name} docs from v${tag}.`);
  const dropped = sorted.slice(BUILT_DOCS_VERSIONS);
  if (dropped.length > 0) {
    io.log(`The site no longer builds ${dropped.join(", ")}. Their snapshots stay in versioned_docs.`);
  }
  return target;
};

// ************************************************************
// Real side effects
// ************************************************************

const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe", ...options })?.trim();
const runVisible = (command, args, options = {}) => run(command, args, { stdio: "inherit", ...options });

const versionsPath = join(DOCS, "versions.json");

const realIo = {
  log: console.log,
  fetchTags: () => run("git", ["fetch", "--tags", "--force", "origin"]),
  tags: () => run("git", ["tag", "--list", "v[0-9]*"]).split("\n").filter(Boolean),
  nextVersion: () => nextWorkspaceVersion({ preid: STABLE.preid }),
  readVersions: () => JSON.parse(readFileSync(versionsPath, "utf8")),
  writeVersions: (versions) => writeFileSync(versionsPath, `${JSON.stringify(versions, null, 2)}\n`),
  // The docs of a tag only build with the packages and site of that tag, so build both there.
  // Generating the API reference is part of loading the docs plugins, which `docs:version` does.
  snapshot: (tag, name) => {
    const worktree = mkdtempSync(join(tmpdir(), "hyper-fetch-docs-"));
    const env = { ...process.env, NX_DAEMON: "false" };
    try {
      run("git", ["worktree", "add", "--detach", worktree, tag]);
      runVisible("pnpm", ["install", "--frozen-lockfile"], { cwd: worktree, env });
      runVisible("pnpm", ["build"], { cwd: worktree, env });
      runVisible("pnpm", ["docusaurus", "docs:version", name], { cwd: join(worktree, "documentation"), env });

      [`versioned_docs/version-${name}`, `versioned_sidebars/version-${name}-sidebars.json`].forEach((path) => {
        rmSync(join(DOCS, path), { recursive: true, force: true });
        cpSync(join(worktree, "documentation", path), join(DOCS, path), { recursive: true });
      });
    } finally {
      run("git", ["worktree", "remove", "--force", worktree]);
    }
  },
};

const parseArgs = (argv) => {
  const index = argv.indexOf("--major");
  const major = index === -1 ? undefined : Number(argv[index + 1]);
  if (major !== undefined && !Number.isInteger(major)) throw new Error("--major takes a number, like --major 8.");
  return { major, check: argv.includes("--check") };
};

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  Promise.resolve()
    .then(() => runDocsVersion(realIo, parseArgs(process.argv)))
    .then((major) => {
      if (process.env.GITHUB_OUTPUT) {
        const name = major === undefined ? "" : docsVersionName(major);
        appendFileSync(process.env.GITHUB_OUTPUT, `major=${major ?? ""}\nname=${name}\n`);
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
