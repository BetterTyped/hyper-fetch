# Examples

Runnable HyperFetch apps. Each one is explained on its own page at
[hyperfetch.bettertyped.com/examples](https://hyperfetch.bettertyped.com/examples/).

| Folder                  | What it is                                                                |
| ----------------------- | ------------------------------------------------------------------------- |
| `<group>/<name>`        | Docs examples: small standalone apps, one idea each, opened in StackBlitz |
| `react-app`, `next-app` | Development apps for working on the packages, not shown in the docs       |
| `next-app-router`       |                                                                           |
| `shop`                  |                                                                           |

## Run an example

```bash
pnpm --dir examples/react/basic dev
```

In the repository `@hyper-fetch/*` resolves to `packages/*` through the root pnpm overrides, so build the packages first
(`pnpm build`). Outside the repository the same folder installs the latest release from npm:

```bash
npx tiged BetterTyped/hyper-fetch/examples/react/basic my-app
```

## Add an example

1. Copy `react/basic` to `<group>/<name>` and rename the package to `@hyper-fetch-examples/<group>-<name>`.
2. Keep `@hyper-fetch/*` dependencies at `"latest"`. StackBlitz and CodeSandbox install the folder from GitHub with npm,
   so `workspace:` and `file:` versions do not work there.
3. Write the README with links to StackBlitz, CodeSandbox and the docs page, like `react/basic/README.md`.
4. Add a page in `documentation/examples/<category>/<slug>.mdx`. Copy `getting-started/basic.mdx`: set
   `sidebar_custom_props.path` to the folder, pick a level and tags, and import the files to show with
   `!!raw-loader!@examples/<group>/<name>/<file>`. The page appears in the sidebar and the catalog by itself.
5. Check it:

```bash
pnpm test:examples
```

```bash
pnpm examples
```

`test:examples` checks the conventions above. `examples` type-checks and builds every example against the current
source. CI runs both.
