import { getConfig } from "config/get-config";
import * as fs from "fs-extra";
import * as os from "node:os";
import * as path from "node:path";

vi.mock("utils/spinner", () => ({
  spinner: vi.fn(() => ({ start: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })) })),
}));
vi.mock("utils/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), log: vi.fn(), break: vi.fn() } }));

describe("cli config [ Auto init ]", () => {
  let cwd = "";

  const createProject = (compilerOptions: Record<string, unknown>) => {
    fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ name: "app" }));
    fs.writeFileSync(path.join(cwd, "tsconfig.json"), JSON.stringify({ compilerOptions }));
  };

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "hyper-fetch-cli-"));
  });

  afterEach(() => {
    fs.removeSync(cwd);
  });

  it("should point the api alias to the created directory when tsconfig has no paths", async () => {
    createProject({});

    const config = await getConfig(cwd);

    expect(config?.resolvedPaths.api).toBe(path.join(cwd, "src", "api"));
    expect(fs.existsSync(config!.resolvedPaths.api)).toBeTrue();
  });

  it("should point the api alias to the created directory when the base url is the source directory", async () => {
    createProject({ baseUrl: "./src" });

    const config = await getConfig(cwd);

    expect(config?.resolvedPaths.api).toBe(path.join(cwd, "src", "api"));
  });

  it("should use the path alias of the project", async () => {
    createProject({ baseUrl: ".", paths: { "@/*": ["./src/*"] } });

    const config = await getConfig(cwd);

    expect(config?.aliases.api).toBe("@/api");
    expect(config?.resolvedPaths.api).toBe(path.join(cwd, "src", "api"));
  });

  it("should keep the configuration which already exists", async () => {
    createProject({});
    await getConfig(cwd);
    const saved = fs.readFileSync(path.join(cwd, "api.json"), "utf8");

    const config = await getConfig(cwd);

    expect(fs.readFileSync(path.join(cwd, "api.json"), "utf8")).toBe(saved);
    expect(config?.resolvedPaths.api).toBe(path.join(cwd, "src", "api"));
  });
});
