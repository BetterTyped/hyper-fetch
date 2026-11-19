import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { lastTagOfMajor, outgoingMajor, runDocsVersion, sortDocsVersions } from "./version-docs.mjs";

const TAGS = ["v8.0.0", "v8.2.4", "v8.10.0-beta.1", "v9.0.0", "v9.8.0", "hyper-fetch-v12.0.0"];

/** In-memory git and docs folder. `calls` records every side effect in order. */
const createIo = ({ tags = TAGS, next = "9.9.0", versions = ["v8.0.0", "v7.0.0"] } = {}) => {
  const calls = [];
  const state = { versions: [...versions] };
  return {
    calls,
    state,
    log: () => {},
    fetchTags: () => {},
    tags: () => tags,
    nextVersion: async () => next,
    readVersions: () => state.versions,
    writeVersions: (value) => {
      state.versions = value;
      calls.push(`write:${value.join(",")}`);
    },
    snapshot: (tag, name) => calls.push(`snapshot:${tag}:${name}`),
  };
};

describe("versions", () => {
  it("finds the last stable tag of a major", () => {
    assert.equal(lastTagOfMajor(TAGS, 8), "8.2.4");
    assert.equal(lastTagOfMajor(TAGS, 9), "9.8.0");
    assert.equal(lastTagOfMajor(TAGS, 12), undefined);
  });

  it("names the outgoing major only for a major release", () => {
    assert.equal(outgoingMajor(TAGS, "10.0.0"), 9);
    assert.equal(outgoingMajor(TAGS, "9.9.0"), undefined);
    assert.equal(outgoingMajor(TAGS, undefined), undefined);
    assert.equal(outgoingMajor([], "1.0.0"), undefined);
  });

  it("sorts majors numerically, newest first", () => {
    assert.deepEqual(sortDocsVersions(["v9.0.0", "v10.0.0", "v7.0.0", "v9.0.0"]), ["v10.0.0", "v9.0.0", "v7.0.0"]);
  });
});

describe("runDocsVersion", () => {
  it("does nothing when the next release is not a major", async () => {
    const io = createIo();
    assert.equal(await runDocsVersion(io), undefined);
    assert.deepEqual(io.calls, []);
  });

  it("freezes the outgoing major from its last tag before a major release", async () => {
    const io = createIo({ next: "10.0.0" });
    assert.equal(await runDocsVersion(io), 9);
    assert.deepEqual(io.calls, ["snapshot:v9.8.0:v9.0.0", "write:v9.0.0,v8.0.0,v7.0.0"]);
  });

  it("does not freeze a major twice", async () => {
    const io = createIo({ next: "10.0.0", versions: ["v9.0.0", "v8.0.0"] });
    assert.equal(await runDocsVersion(io), undefined);
    assert.deepEqual(io.calls, []);
  });

  it("only reports the major on a check", async () => {
    const io = createIo({ next: "10.0.0" });
    assert.equal(await runDocsVersion(io, { check: true }), 9);
    assert.deepEqual(io.calls, []);
  });

  it("backfills a missed major and keeps the order", async () => {
    const io = createIo({ versions: ["v7.0.0"] });
    assert.equal(await runDocsVersion(io, { major: 8 }), 8);
    assert.deepEqual(io.calls, ["snapshot:v8.2.4:v8.0.0", "write:v8.0.0,v7.0.0"]);
  });

  it("fails when the major was never released", async () => {
    await assert.rejects(runDocsVersion(createIo(), { major: 12 }), /no v12\.x\.y tag/);
  });
});
