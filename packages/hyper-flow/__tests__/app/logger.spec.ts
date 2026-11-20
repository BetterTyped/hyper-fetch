import type { MockInstance } from "vitest";

import { appLogger, serverLogger } from "@shared/utils/logger";

describe("Logger", () => {
  let log: MockInstance<typeof console.log>;
  let error: MockInstance<typeof console.error>;

  const printed = (spy: MockInstance<typeof console.log>) => spy.mock.calls.flat().join("\n");

  beforeEach(() => {
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should label the location, level and context", () => {
    appLogger.info("Window opened", { context: "Main" });
    serverLogger.warning("Odd message");

    expect(printed(log)).toContain("[APPLICATION]");
    expect(printed(log)).toContain("[INFO]");
    expect(printed(log)).toContain("[Main] Window opened");
    expect(printed(log)).toContain("[SERVER]");
    expect(printed(log)).toContain("[WARNING]");
    expect(printed(log)).not.toContain("[undefined]");
  });

  it("should print the details of every level, errors included", () => {
    serverLogger.success("Started", { details: { port: 2137 } });
    serverLogger.error("Failed to send", { details: { reason: "No connection exists" } });

    expect(printed(log)).toContain('"port": 2137');
    expect(printed(error)).toContain("Failed to send");
    expect(printed(error)).toContain('"reason": "No connection exists"');
  });

  it("should print the message and stack of an error", () => {
    const failure = new Error("Port check failed");

    appLogger.error("Error checking port", { error: failure });

    expect(printed(error)).toContain("Port check failed");
    expect(printed(error)).toContain(failure.stack!.split("\n")[1]);
  });

  it("should print an error that is not an Error as JSON", () => {
    appLogger.error("Rejected", { error: { code: "EACCES" } });

    expect(printed(error)).toContain('"code": "EACCES"');
  });

  it("should work as a detached callback", async () => {
    // e.g. shell.openExternal(url).catch(appLogger.error)
    await expect(Promise.reject(new Error("No handler for url")).catch(appLogger.error)).resolves.toBeUndefined();

    expect(printed(error)).toContain("No handler for url");
  });

  it("should only print errors in production", () => {
    vi.stubEnv("VITE_ENVIRONMENT", "production");

    appLogger.info("info");
    appLogger.success("success");
    appLogger.warning("warning");
    appLogger.debug("debug");
    appLogger.error("error");

    expect(log).not.toHaveBeenCalled();
    expect(printed(error)).toContain("error");
  });

  it("should only print debug messages while developing", () => {
    vi.stubEnv("VITE_ENVIRONMENT", "test");
    appLogger.debug("hidden");
    expect(log).not.toHaveBeenCalled();

    vi.stubEnv("VITE_ENVIRONMENT", "development");
    appLogger.debug("shown", { details: { port: 1 } });

    expect(printed(log)).toContain("[DEBUG]");
    expect(printed(log)).toContain("shown");
    expect(printed(log)).toContain('"port": 1');
  });
});
