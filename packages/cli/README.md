# 🪄 Hyper Fetch CLI

<p align="center">
  <b>Generate typed API clients from OpenAPI/Swagger schemas. Your SDK is one command away.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/cli">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/cli" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/cli">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/cli" alt="npm downloads" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/openapi-green?logo=openapiinitiative&logoColor=white" alt="OpenAPI" />
  </a>
</p>

## 📖 About

The HyperFetch CLI reads your OpenAPI 3.x schema and generates a complete, fully typed SDK built on `@hyper-fetch/core`. Every endpoint with an `operationId` becomes a typed request — params, payloads, query params, and response types are all extracted from the schema. The generated code is standard HyperFetch you can customize freely.

## 🎯 Key Capabilities

- 🪄 **One command, full SDK** — Point at an OpenAPI schema and get a complete typed client
- 🔮 **Types extracted from your schema** — Params, payloads, query params, and responses — you write none of them
- 🔓 **No lock-in** — Generated code is standard `@hyper-fetch/core` you can customize, extend, and override
- 📡 **Remote or local schemas** — Pass a URL or a local `.json` file path
- 🧭 **Interactive mode** — Run without flags and the CLI walks you through every option
- ✏️ **Your code, your rules** — Edit the generated client, add auth, override individual requests

## 🚀 Quick Start

### 1. Initialize your project

```bash
# Creates api.json config and the api/ directory structure
npx @hyper-fetch/cli init
```

This creates an `api.json` config file at your project root and sets up the output directory (default: `src/api/`).

### 2. Generate your SDK

```bash
# Generate from a remote OpenAPI schema
npx @hyper-fetch/cli generate --url https://api.example.com/openapi.json
```

### 3. Use the generated SDK

```ts
import { sdk } from "./src/api/api-openapi.sdk";

// Every endpoint is typed — params, payloads, and responses
const { data } = await sdk.users.list.send();
const { data: user } = await sdk.users.get.setParams({ userId: 1 }).send();
```

## 📋 Commands

### `init`

Sets up the project directory structure and creates the `api.json` config file.

```bash
npx @hyper-fetch/cli init
```

| Flag | Description |
| --- | --- |
| `-y`, `--yes` | Skip prompts and use defaults (`src/api/`) |
| `-c`, `--cwd <path>` | Set working directory (default: current directory) |

Without `--yes`, you'll be asked to choose:
- **Main directory** — `src`, `app`, or a custom path
- **API subdirectory** — name of the folder for generated files (default: `api`)

### `generate`

Reads an OpenAPI schema and generates a typed SDK file.

```bash
npx @hyper-fetch/cli generate --url <schema> [options]
```

| Flag | Description |
| --- | --- |
| `-u`, `--url <url>` | Schema source — a URL or local file path (relative to cwd) |
| `-t`, `--template <type>` | Schema type: `openapi` or `swagger` (default: interactive prompt) |
| `-f`, `--fileName <name>` | Output filename (default: `api-openapi.sdk.ts`) |
| `-o`, `--overwrite` | Overwrite existing file without asking |
| `-c`, `--cwd <path>` | Set working directory (default: current directory) |

Without flags, the CLI runs in **interactive mode** — it prompts for every option.

## ⚙️ Configuration — `api.json`

The `init` command creates an `api.json` file at your project root. This is the only config file the CLI uses.

```json
{
  "tsx": true,
  "aliases": {
    "api": "@/api",
    "hooks": "@/hooks",
    "ui": "@/ui",
    "components": "@/components",
    "lib": "@/lib"
  }
}
```

| Field | Description |
| --- | --- |
| `tsx` | When `true`, generates `.ts` files. When `false`, generates `.js` |
| `aliases` | Path aliases resolved from your `tsconfig.json` paths. Controls where the SDK file is written |

The CLI auto-detects your `tsconfig.json` path aliases (e.g. `@/*` → `./src/*`) to resolve output directories.

## 📁 Generated Output

The CLI generates a **single TypeScript file** under your configured API directory:

```
src/
  api/
    api-openapi.sdk.ts    ← generated SDK file
```

The generated file contains:

1. **Schema types** — TypeScript interfaces for every schema component
2. **Typed requests** — One `createRequest` call per endpoint (with `operationId`)
3. **SDK tree** — Nested object mirroring your API paths: `sdk.users.get`, `sdk.posts.list`, etc.
4. **`createSdk` function** — Factory to create the SDK with your custom client

```ts
// What gets generated (simplified)
import { createSdk as coreCreateSdk, ClientInstance, Request } from "@hyper-fetch/core";

// Schema types extracted from your OpenAPI document
export interface Components {
  schemas: {
    User: { id: number; name: string; email: string };
    // ... all your schema types
  };
}

// Typed request for each endpoint with operationId
export const getUsers = client.createRequest<{
  response: Components["schemas"]["User"][];
}>()({
  endpoint: "/users",
  method: "GET",
});

// SDK tree you import and use
export const createSdk = <Client extends ClientInstance>(client: Client) =>
  coreCreateSdk<Client, SdkSchema<Client>>(client);
```

## ⚠️ Important Notes

- **`operationId` is required** — Only endpoints with an `operationId` in the schema are included. Endpoints without one are silently skipped.
- **JSON schemas only for local files** — Local file paths must point to `.json` files. YAML is not supported for local files.
- **Remote schemas are fetched with GET** — No auth headers are sent. If your schema requires authentication, download it locally first and pass the file path.
- **Path params are converted** — `{userId}` in OpenAPI becomes `:userId` in HyperFetch endpoints.
- **Path segments are camelCased** — Kebab-case path segments become camelCase keys in the SDK tree. `{param}` segments become `$param`.

## 📚 Documentation

- [Generate Command](https://hyperfetch.bettertyped.com/docs/cli/commands/generate)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Generate from a remote schema

```bash
# OpenAPI 3.x schema from a URL
npx @hyper-fetch/cli generate --url https://petstore3.swagger.io/api/v3/openapi.json
```

### Generate from a local file

```bash
# Local JSON file relative to your project root
npx @hyper-fetch/cli generate --url ./schemas/openapi.json --fileName my-api.sdk.ts
```

### Skip all prompts (CI/scripts)

```bash
# Non-interactive: all flags provided, overwrite existing file
npx @hyper-fetch/cli generate \
  --url https://api.example.com/openapi.json \
  --template openapi \
  --fileName api.sdk.ts \
  --overwrite
```

### Use the generated SDK

```ts
import { createSdk } from "./src/api/api-openapi.sdk";
import { createClient } from "@hyper-fetch/core";

// Create your client with any configuration you need
const client = createClient({ url: "https://api.example.com" });

// Create the typed SDK from your client
const sdk = createSdk(client);

// Every method is fully typed — params, payloads, and responses
const { data: users } = await sdk.users.list.send();
const { data: user } = await sdk.users.get.setParams({ userId: 1 }).send();
const { data: newUser } = await sdk.pets.create.send({
  data: { name: "Buddy", species: "dog" },
});
```

### Add authentication to the generated client

```ts
import { createSdk } from "./src/api/api-openapi.sdk";
import { createClient } from "@hyper-fetch/core";

const client = createClient({ url: "https://api.example.com" });
const sdk = createSdk(client);

// Add auth header to every request through the client
client.onAuth((request) => {
  return request.setHeaders({ Authorization: `Bearer ${getToken()}` });
});

// All SDK requests now include the auth header automatically
const { data } = await sdk.users.me.send();
```

### Programmatic usage (no CLI)

```ts
import { OpenapiRequestGenerator } from "@hyper-fetch/cli";

// Use the generator directly in scripts or build tools
const schema = await OpenapiRequestGenerator.getSchemaFromUrl(url, config);
const generator = new OpenapiRequestGenerator(schema, config);
const output = await generator.generateFile(fileName);
```

## Disclaimer

This package is inspired by [openapi-client-axios](https://www.npmjs.com/package/openapi-client-axios).

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
