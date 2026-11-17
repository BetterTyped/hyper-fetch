import { generateId } from "@hyper-fetch/ai";

describe("generateId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should return a non-empty string of url-safe characters", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id).toMatch(/^[0-9a-z]{17,}$/);
  });

  it("should start with the given prefix", () => {
    expect(generateId("msg_")).toMatch(/^msg_[0-9a-z]{17,}$/);
    expect(generateId("thread-")).toMatch(/^thread-[0-9a-z]{17,}$/);
    expect(generateId("")).toMatch(/^[0-9a-z]{17,}$/);
  });

  it("should not add a separator after the prefix", () => {
    const id = generateId("p");
    expect(id.startsWith("p")).toBe(true);
    expect(id).not.toContain("_");
    expect(id).not.toContain("-");
  });

  it("should never repeat an id in 50 000 calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50_000; i += 1) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(50_000);
  });

  it("should never repeat an id across prefixes", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      ids.add(generateId("a"));
      ids.add(generateId("b"));
      ids.add(generateId());
    }
    expect(ids.size).toBe(3000);
  });

  it("should stay unique when the random source repeats itself", () => {
    // The counter suffix makes ids unique in a process even with a broken random source
    vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000000" });
    const ids = new Set(Array.from({ length: 5000 }, () => generateId()));
    expect(ids.size).toBe(5000);
    expect([...ids].every((id) => id.startsWith("0000000000004000"))).toBe(true);
  });

  it("should use 16 hex characters of crypto.randomUUID", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "01234567-89ab-4cde-8f01-23456789abcd" });
    const id = generateId("x_");
    expect(id.startsWith("x_0123456789ab4cde")).toBe(true);
    // Whatever follows the random part is the base 36 counter
    expect(id.slice("x_0123456789ab4cde".length)).toMatch(/^[0-9a-z]+$/);
  });

  it("should increase the counter suffix with every call", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "ffffffff-ffff-4fff-8fff-ffffffffffff" });
    const counter = (id: string) => Number.parseInt(id.slice(16), 36);
    const first = counter(generateId());
    expect(counter(generateId())).toBe(first + 1);
    expect(counter(generateId("ignored-prefix-").slice("ignored-prefix-".length))).toBe(first + 2);
  });

  it.each([
    ["crypto is missing", undefined],
    ["crypto has no randomUUID", {}],
    ["randomUUID is not a function", { randomUUID: "nope" }],
  ])("should fall back to time and Math.random when %s", (_name, crypto) => {
    vi.stubGlobal("crypto", crypto);
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.123_456_789);

    const id = generateId("run_");
    const time = (1_700_000_000_000).toString(36);
    const random = (0.123_456_789).toString(36).slice(2, 10);
    expect(id.startsWith(`run_${time}${random}`)).toBe(true);
    expect(id).toMatch(/^run_[0-9a-z]+$/);
  });

  it("should stay unique in the fallback even when time and Math.random do not change", () => {
    vi.stubGlobal("crypto", {});
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const ids = new Set(Array.from({ length: 5000 }, () => generateId()));
    expect(ids.size).toBe(5000);
  });

  it("should not throw in the fallback for the edge values of Math.random", () => {
    vi.stubGlobal("crypto", {});
    const random = vi.spyOn(Math, "random");
    [0, 0.5, 1 - Number.EPSILON, Number.MIN_VALUE].forEach((value) => {
      random.mockReturnValue(value);
      expect(generateId("p_")).toMatch(/^p_[0-9a-z]+$/);
    });
  });
});
