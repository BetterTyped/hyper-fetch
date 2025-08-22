import * as fs from "fs-extra";
import { jest } from "@jest/globals";
import { input, select, confirm } from "@inquirer/prompts";

import { generate } from "commands/generate";
import { handleError } from "utils/handle-error";
import { preFlightGenerate } from "preflights/preflight-generate";
import { OpenapiRequestGenerator } from "codegen/openapi/generator";

// Mocks
jest.mock("utils/handle-error", () => ({ handleError: jest.fn() }));
jest.mock("preflights/preflight-generate", () => {
  const fakeConfig = {
    tsx: true,
    aliases: { api: "/tmp", hooks: "/tmp", ui: "/tmp", components: "/tmp", lib: "/tmp" },
    resolvedPaths: { cwd: "/tmp", api: "/tmp", hooks: "/tmp", ui: "/tmp", components: "/tmp", lib: "/tmp" },
  };
  return {
    preFlightGenerate: jest.fn(async () => ({ errors: {}, config: fakeConfig })),
  };
});
jest.mock("codegen/openapi/generator", () => {
  class FakeGenerator {
    static getSchemaFromUrl = jest.fn(async () => ({ openapi: "3.0.0", paths: {} }));
    generateFile = jest.fn(async () => undefined);
  }
  return { OpenapiRequestGenerator: FakeGenerator };
});
jest.mock("utils/spinner", () => ({
  spinner: jest.fn(() => ({
    start: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn() })),
  })),
}));
jest.mock("utils/logger", () => ({ logger: { info: jest.fn(), error: jest.fn(), log: jest.fn() } }));
jest.mock("fs-extra", () => ({ existsSync: jest.fn(() => false) }));
jest.mock("@inquirer/prompts", () => ({
  input: jest.fn(),
  select: jest.fn(),
  confirm: jest.fn(),
}));

describe("cli generate command", () => {
  const originalArgv = process.argv;
  const exitSpy = jest
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as (code?: string | number | null | undefined) => never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    exitSpy.mockRestore();
    process.argv = originalArgv;
  });

  it("bypasses prompts and generates when params are provided", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

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
    (fs.existsSync as jest.Mock).mockReturnValue(false);

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
