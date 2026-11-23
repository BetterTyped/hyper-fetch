import fs from "node:fs";
import path from "node:path";

const packageDir = path.join(__dirname, "../../..");
const srcDir = path.join(packageDir, "src");

// Read from disk rather than imported, so a package without `peerDependenciesMeta` still type checks.
const pkg: { peerDependenciesMeta?: Record<string, { optional?: boolean }> } = JSON.parse(
  fs.readFileSync(path.join(packageDir, "package.json"), "utf8"),
);

const optionalPeers = Object.entries(pkg.peerDependenciesMeta ?? {})
  .filter(([, meta]) => meta.optional)
  .map(([name]) => name);

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(file);
    return /\.tsx?$/.test(entry.name) ? [file] : [];
  });

/** Names an `import` or `export ... from` statement brings in at runtime. Type-only names are left out. */
const getValueImports = (code: string, peer: string) => {
  const statements = code.matchAll(
    new RegExp(`(import|export)\\s+(type\\s+)?([^;]*?)\\s+from\\s+["']${peer}["']`, "g"),
  );
  return [...statements].flatMap(([, , typeOnly, clause]) => {
    if (typeOnly) return [];
    const named = clause.match(/\{([^}]*)\}/)?.[1];
    if (!named) return [clause.trim()];
    return named
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name && !name.startsWith("type "));
  });
};

describe("Package [ Optional peers ]", () => {
  it("should import optional peers only as types, so installs without them keep working", () => {
    // npm does not install optional peers. A runtime import of one breaks every app that did not add it by hand.
    const valueImports = listSourceFiles(srcDir).flatMap((file) =>
      optionalPeers.flatMap((peer) =>
        getValueImports(fs.readFileSync(file, "utf8"), peer).map(
          (name) => `${path.relative(srcDir, file)}: ${name} from ${peer}`,
        ),
      ),
    );

    expect(valueImports).toStrictEqual([]);
  });
});
