---
name: publish-new-package
description:
  Put a brand new hyper-fetch package on npm for the first time and connect it to trusted publishing, so the shared
  release can publish it. Use when a package under `packages/` is not on npm yet, when the Release job fails with "not
  on npm yet ... NPM_BOOTSTRAP_TOKEN", before merging a PR that adds a package, or when the user says "first publish",
  "publish the new package", "add trusted publishing" or "npm trust".
metadata:
  internal: true
---

# Publish a new package

The release publishes every package under one shared version through trusted publishing (OIDC). Trusted publishing
cannot create a package, and the repo has no `NPM_BOOTSTRAP_TOKEN` secret, so `scripts/release.mjs` stops before tagging
while any package is missing from npm. That blocks the release of every package, not only the new one.

So a new package is published once by hand, then trusted, then the PR that releases it is merged.

**The maintainer runs every `npm publish`, `npm login` and `npm trust` command.** They need 2FA in the browser. You
build and verify the tarball and hand over the exact commands.

## 1. Confirm the package is missing

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://registry.npmjs.org/@hyper-fetch%2f<name>
```

`404` means it has never been published. Also read the version to publish, which is the latest released tag:

```bash
git fetch origin main --tags && git describe --tags --abbrev=0 origin/main
```

Publish the new package at that version (without the `v`). The next release then bumps it with every other package.

## 2. Build from `main`

The new package must already be merged to `main`, and the tarball must be built from that code. Work in a worktree on
`origin/main` (or a branch whose `packages/<dir>` matches it: `git diff --quiet HEAD origin/main -- packages/<dir>`).

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm exec nx run <project>:build --skip-nx-cache
```

## 3. Pack a copy with the version set

Never change `version` in the repo. The release writes versions at publish time and nothing is committed.

```bash
OUT=$(mktemp -d) && rsync -a --exclude node_modules packages/<dir>/ "$OUT/pkg/"
```

```bash
cd "$OUT/pkg" && node -e 'const f="package.json",p=require("./"+f);p.version=process.argv[1];require("fs").writeFileSync(f,JSON.stringify(p,null,2)+"\n")' <version> && npm pack --pack-destination "$OUT"
```

## 4. Verify the tarball

- `tar tzf "$OUT"/*.tgz` contains `dist/index.mjs`, `dist/index.d.ts` and `README.md`, laid out like a published sibling
  (`npm view @hyper-fetch/hono dist.tarball`, download and compare).
- `tar xzOf "$OUT"/*.tgz package/package.json` shows the version and keeps `"@hyper-fetch/core": "*"`. A `workspace:`
  range must never appear.
- Install it in an empty folder next to `@hyper-fetch/core@<version>` and its framework peer, then typecheck a small
  real usage with `tsc --strict` and `node --input-type=module -e "await import('<pkg>')"`. A type-only package still
  needs the import to resolve.

## 5. Hand over the commands

Check the login first. `npm whoami` returning `401` means the session expired. An unauthenticated publish of a new
scoped package fails with a misleading `404 Not Found - PUT`.

```bash
npm whoami
```

```bash
npm login
```

```bash
npm publish <absolute path to tgz> --access public
```

For about 90 seconds after a first publish npm can show a `0.0.0-stage` placeholder as `latest`. Wait, then confirm:

```bash
npm view @hyper-fetch/<name> versions
```

Then trust the release job in `.github/workflows/workflow.yml` (no GitHub environment). `npm trust` needs npm >= 11.15
with `--allow-publish`: npm 11.12.1 sends no permission and the registry answers a bare `E400 Bad Request` after 2FA
(seen for both oxlint and elysia). npm 12 needs a newer Node than `.nvmrc`, so use npm 11.21.3.

Run that npm directly, not through `npx`: inside `npx` the 2FA prompt (`Authenticate your account at: <url>` /
`Press ENTER to open in the browser...`) can be hidden, which looks like a hang. Install it into a temporary folder:

```bash
NPM11=$(mktemp -d) && npm i --prefix "$NPM11" --no-audit --no-fund npm@11.21.3
```

```bash
"$NPM11/node_modules/.bin/npm" trust github @hyper-fetch/<name> --file workflow.yml --repo BetterTyped/hyper-fetch --allow-publish --yes
```

Approve the 2FA page it prints. Confirm the relationship:

```bash
"$NPM11/node_modules/.bin/npm" trust list @hyper-fetch/<name>
```

## 6. Release within 48 hours

A new trust config expires 48 hours after creation unless a publish goes through it. Merge the next releasing PR
(`feat`, `fix`, `perf` or `revert` on `main`) inside that window. If it expires, revoke and create it again.

After the merge, follow `ship-change` step 6: the `Release` job is green, a new `v*` tag exists, and
`npm view @hyper-fetch/<name> version` shows the new shared version.

## Pitfalls

- Publishing from `packages/<dir>` directly ships version `0.0.0` and leaves a dirty `package.json`.
- Publishing a package that is not merged to `main` ships code that matches no tag, and the version can never be
  republished.
- A failed release while a package is missing publishes and tags nothing. Re-run the workflow after the manual publish;
  re-running is the whole recovery procedure.
