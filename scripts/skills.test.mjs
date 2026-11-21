/**
 * Keeps the internal agent skills off skills.sh.
 *
 * The `skills` CLI (`npx skills add BetterTyped/hyper-fetch`) and the skills.sh leaderboard find every SKILL.md in the
 * repo root, `skills/` and the agent folders such as `.claude/skills/`. Only the skills in `skills/` are public. Every
 * other skill must set `metadata.internal: true`, which the CLI hides unless `INSTALL_INTERNAL_SKILLS=1` is set - a new
 * internal skill without it would be published the first time someone installs from the repo.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every SKILL.md in git, new ones included - the ignore rules skip worktrees, node_modules and build output */
const skillFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*SKILL.md"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

/** The YAML frontmatter between the leading `---` lines, `null` when the file has none */
const getFrontmatter = (content) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  return match ? match[1] : null;
};

/** A top-level key of the frontmatter, with the indented lines that continue it */
const getBlock = (frontmatter, key) => {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) {
    return null;
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.trim() !== "" && !/^\s/.test(line));
  return [lines[start].slice(key.length + 1), ...(end === -1 ? rest : rest.slice(0, end))].join("\n").trim();
};

const unquote = (value) => value.replace(/^["']|["']$/g, "");

/** `metadata.internal` the way the CLI reads it: `true`, `"true"` or `"1"` */
const isInternal = (frontmatter) => {
  const metadata = getBlock(frontmatter, "metadata");
  const internal = metadata && /^\s*internal:\s*(.+?)\s*$/m.exec(metadata);
  return !!internal && ["true", "1"].includes(unquote(internal[1]));
};

const readSkill = (file) => {
  const frontmatter = getFrontmatter(fs.readFileSync(path.join(root, file), "utf8"));
  assert.ok(frontmatter, `${file} has no frontmatter`);
  return {
    file,
    frontmatter,
    name: unquote(getBlock(frontmatter, "name") ?? ""),
    description: getBlock(frontmatter, "description") ?? "",
    internal: isInternal(frontmatter),
  };
};

const skills = skillFiles.map(readSkill);
const isPublicPath = (file) => file.startsWith("skills/");

describe("Agent skills", () => {
  test("finds the public and the internal skills", () => {
    assert.ok(
      skills.some(({ file }) => isPublicPath(file)),
      "no public skills in skills/",
    );
    assert.ok(
      skills.some(({ file }) => !isPublicPath(file)),
      "no internal skills outside skills/",
    );
  });

  test("marks every skill outside skills/ as internal", () => {
    const published = skills.filter(({ file, internal }) => !isPublicPath(file) && !internal).map(({ file }) => file);

    assert.deepEqual(
      published,
      [],
      "add `metadata:\\n  internal: true` to the frontmatter, or move the skill to skills/",
    );
  });

  test("keeps every skill in skills/ public", () => {
    const hidden = skills.filter(({ file, internal }) => isPublicPath(file) && internal).map(({ file }) => file);

    assert.deepEqual(hidden, [], "public skills must not set metadata.internal");
  });

  test("places one public skill per folder, named after it", () => {
    skills
      .filter(({ file }) => isPublicPath(file))
      .forEach(({ file, name }) => {
        assert.match(file, /^skills\/[^/]+\/SKILL\.md$/, `${file} must be skills/<name>/SKILL.md`);
        assert.equal(name, path.basename(path.dirname(file)), `${file} must be named after its folder`);
      });
  });

  test("gives every skill the name and description the CLI needs to list it", () => {
    skills.forEach(({ file, name, description }) => {
      assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${file}: name must be lowercase with hyphens`);
      assert.ok(description.length > 0, `${file}: description is empty`);
    });
  });
});
