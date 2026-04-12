import { vi } from "vitest";
import { input, select, confirm } from "@inquirer/prompts";

import { generate } from "commands/generate";
import { handleError } from "utils/handle-error";
import { preFlightGenerate } from "preflights/preflight-generate";
import { OpenapiRequestGenerator } from "codegen/openapi/generator";

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
    generateFile = vi.fn(async () => undefined);
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
    .mockImplementation((() => undefined) as (code?: string | number | null | undefined) => never);

  beforeEach(() => {
    vi.clearAllMocks();
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
});
