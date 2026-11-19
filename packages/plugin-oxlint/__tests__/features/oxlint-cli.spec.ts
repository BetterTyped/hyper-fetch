import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const packageRoot = path.resolve(__dirname, "../..");
const oxlintBin = path.join(packageRoot, "node_modules/.bin/oxlint");

type Diagnostic = { code: string; message: string; filename: string };

const lint = (cwd: string) => {
  const result = spawnSync(oxlintBin, ["--format", "json", "--threads", "1"], { cwd, encoding: "utf8" });
  const { diagnostics } = JSON.parse(result.stdout) as { diagnostics: Diagnostic[] };
  return {
    status: result.status,
    diagnostics: diagnostics
      .map(({ code, message, filename }) => ({ code, message, filename: path.basename(filename) }))
      .toSorted((a, b) => a.filename.localeCompare(b.filename)),
  };
};

describe("oxlint CLI", () => {
  let cwd: string;

  const writeFiles = (files: Record<string, string>) => {
    Object.entries(files).forEach(([name, content]) => writeFileSync(path.join(cwd, name), content));
  };

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), "oxlint-plugin-hyper-fetch-"));
    // Installed the way users get it, so oxlint resolves the package name through its `exports`.
    mkdirSync(path.join(cwd, "node_modules"));
    symlinkSync(packageRoot, path.join(cwd, "node_modules/oxlint-plugin-hyper-fetch"), "dir");
    writeFiles({
      ".oxlintrc.json": JSON.stringify({
        plugins: [],
        categories: { correctness: "off" },
        ignorePatterns: ["node_modules"],
        jsPlugins: ["oxlint-plugin-hyper-fetch"],
        rules: {
          "hyper-fetch/client-generic-types": "error",
          "hyper-fetch/request-generic-types": "error",
        },
      }),
    });
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it("should report hyper-fetch rules from the built plugin", () => {
    writeFiles({
      "client.ts": `import { createClient } from "@hyper-fetch/core";\nexport const client = createClient<{ eror: Error }>({ url: "/" });\n`,
      "request.ts": `export const getUser = client.createRequest<{ rsponse: { id: string } }>()({ endpoint: "/users" });\n`,
      "valid.ts": `export const getUser = client.createRequest<{ response: { id: string }; params: { id: string } }>()({ endpoint: "/users/:id" });\n`,
    });

    const { status, diagnostics } = lint(cwd);

    expect(status).toBe(1);
    expect(diagnostics).toStrictEqual([
      {
        code: "hyper-fetch(client-generic-types)",
        message: "Unexpected generic type(s) found: eror",
        filename: "client.ts",
      },
      {
        code: "hyper-fetch(request-generic-types)",
        message: "Unexpected generic type(s) found: rsponse",
        filename: "request.ts",
      },
    ]);
  });

  it("should not carry imports from one file into the next", () => {
    // One thread lints every file with the same rule instance, so per-file state must reset.
    writeFiles({
      "a-core.ts": `import { createClient } from "@hyper-fetch/core";\nexport const client = createClient<{ error: Error }>({ url: "/" });\n`,
      "b-other.ts": `import { createClient as other } from "other-lib";\nconst createClient = other;\nexport const client = createClient<{ anything: true }>();\n`,
    });

    const { status, diagnostics } = lint(cwd);

    expect(diagnostics).toStrictEqual([]);
    expect(status).toBe(0);
  });
});
