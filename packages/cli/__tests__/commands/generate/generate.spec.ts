import { input, select, confirm } from "@inquirer/prompts";
import { OpenapiRequestGenerator } from "codegen/openapi/generator";
import { generate } from "commands/generate";
import { preFlightGenerate } from "preflights/preflight-generate";
import { handleError } from "utils/handle-error";
import * as fs from "fs-extra";
import * as os from "node:os";
import * as path from "node:path";
import { logger } from "utils/logger";
import { vi } from "vitest";

// Mocks
vi.mock("utils/handle-error", () => ({ handleError: vi.fn() }));
vi.mock("preflights/preflight-generate", () => {
  const fakeConfig = {
    tsx: true,
    aliases: { api: "/tmp", hooks: "/tmp", ui: "/tmp", components: "/tmp", lib: "/tmp" },
    resolvedPaths: { cwd: "/tmp", api: "/tmp", hooks: "/tmp", ui: "/tmp", components: "/tmp", lib: "/tmp" },
  };
  return {
    preFlightGenerate: vi.fn(async () => ({ errors: {}, config: fakeConfig })),
  };
});
vi.mock("codegen/openapi/generator", () => {
  class FakeGenerator {
    static getSchemaFromUrl = vi.fn(async () => ({ openapi: "3.0.0", paths: {} }));
    generateFile = vi.fn(async () => {});
  }
  return { OpenapiRequestGenerator: FakeGenerator };
});
vi.mock("utils/spinner", () => ({
  spinner: vi.fn(() => ({
    start: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })),
  })),
}));
vi.mock("utils/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), log: vi.fn() } }));
vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
}));

describe("cli generate command", () => {
  const originalArgv = process.argv;
  const exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation((() => {}) as (code?: string | number | null | undefined) => never);

  beforeEach(() => {
    vi.clearAllMocks();
    // Commander keeps parsed option values on the command, reset them so flags do not leak between specs
    generate.options.forEach((option) => {
      generate.setOptionValue(option.attributeName(), option.defaultValue);
    });
  });

  afterAll(() => {
    exitSpy.mockRestore();
    process.argv = originalArgv;
  });

  it("bypasses prompts and generates when params are provided", async () => {
    process.argv = [
      "/usr/local/bin/node",
      "cli",
      "--template",
      "openapi",
      "--url",
      "https://example.com/openapi.json",
      "--fileName",
      "api-openapi.sdk.ts",
      "--cwd",
      "/tmp",
      "--overwrite",
    ];

    await generate.parseAsync(process.argv, { from: "user" });

    expect(preFlightGenerate).toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(input).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(OpenapiRequestGenerator.getSchemaFromUrl).toHaveBeenCalledWith({
      url: "https://example.com/openapi.json",
      config: expect.any(Object),
    });
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("handles invalid params by displaying error", async () => {
    process.argv = [
      "/usr/local/bin/node",
      "cli",
      "--template",
      "invalid-template",
      "--url",
      "not-a-url",
      "--fileName",
      "api-invalid.sdk.ts",
      "--cwd",
      "/tmp",
    ];

    await generate.parseAsync(process.argv, { from: "user" });

    expect(select).not.toHaveBeenCalled();
    expect(input).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledWith(expect.any(Error));
    expect(process.exit).not.toHaveBeenCalledWith(0);
  });

  describe("when the SDK file already exists", () => {
    let cwd: string;
    let apiDir: string;

    const run = async (fileName: string, ...flags: string[]) => {
      const config = {
        tsx: true,
        aliases: { api: "@/api", hooks: "@/hooks", ui: "@/ui", components: "@/components", lib: "@/lib" },
        resolvedPaths: { cwd, api: apiDir, hooks: cwd, ui: cwd, components: cwd, lib: cwd },
      };
      vi.mocked(preFlightGenerate).mockResolvedValueOnce({ errors: {}, config });
      process.argv = [
        "/usr/local/bin/node",
        "cli",
        "--template",
        "openapi",
        "--url",
        "https://example.com/openapi.json",
        "--fileName",
        fileName,
        "--cwd",
        cwd,
        ...flags,
      ];
      await generate.parseAsync(process.argv, { from: "user" });
    };

    beforeEach(async () => {
      cwd = await fs.mkdtemp(path.join(os.tmpdir(), "hf-cli-generate-"));
      apiDir = path.join(cwd, "src", "api");
      await fs.mkdirp(apiDir);
    });

    afterEach(async () => {
      await fs.remove(cwd);
    });

    it("asks before overwriting the file in the api folder", async () => {
      await fs.writeFile(path.join(apiDir, "api.sdk.ts"), "// existing");
      vi.mocked(confirm).mockResolvedValueOnce(false);

      await run("api.sdk.ts");

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("--overwrite"));
      expect(OpenapiRequestGenerator.getSchemaFromUrl).not.toHaveBeenCalled();
    });

    it("finds the existing file when the file name has no extension", async () => {
      await fs.writeFile(path.join(apiDir, "api.sdk.ts"), "// existing");
      vi.mocked(confirm).mockResolvedValueOnce(false);

      await run("api.sdk");

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(OpenapiRequestGenerator.getSchemaFromUrl).not.toHaveBeenCalled();
    });

    it("generates when the prompt is confirmed", async () => {
      await fs.writeFile(path.join(apiDir, "api.sdk.ts"), "// existing");
      vi.mocked(confirm).mockResolvedValueOnce(true);

      await run("api.sdk.ts");

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(OpenapiRequestGenerator.getSchemaFromUrl).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("generates without asking when --overwrite is passed", async () => {
      await fs.writeFile(path.join(apiDir, "api.sdk.ts"), "// existing");

      await run("api.sdk.ts", "--overwrite");

      expect(confirm).not.toHaveBeenCalled();
      expect(OpenapiRequestGenerator.getSchemaFromUrl).toHaveBeenCalled();
    });

    it("does not ask when only a file outside the api folder has the same name", async () => {
      await fs.writeFile(path.join(cwd, "api.sdk.ts"), "// unrelated");

      await run("api.sdk.ts");

      expect(confirm).not.toHaveBeenCalled();
      expect(OpenapiRequestGenerator.getSchemaFromUrl).toHaveBeenCalled();
    });
  });
});
