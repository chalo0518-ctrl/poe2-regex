import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertNoCatastrophicDrop,
  canonicalJson,
  checkGeneratedDir,
  ValidationError,
  writeGeneratedJson,
} from "./generated.mjs";
import { FetchError, fetchText } from "./http.mjs";
import { boolFlag, parseArgs } from "./args.mjs";

const GENERATED = join(dirname(fileURLToPath(import.meta.url)), "../../packages/data/generated");

describe("parseArgs", () => {
  it("parses long flags and equals values", () => {
    const { flags } = parseArgs(["--check", "--out-dir", "/tmp/x", "--from-fixtures=./fx", "--dry-run"]);
    assert.equal(flags.check, true);
    assert.equal(flags["out-dir"], "/tmp/x");
    assert.equal(flags["from-fixtures"], "./fx");
    assert.equal(flags["dry-run"], true);
    assert.equal(boolFlag(flags.check), true);
    const viaPnpm = parseArgs(["--", "--out-dir", "/tmp/y", "--dry-run"]);
    assert.equal(viaPnpm.flags["out-dir"], "/tmp/y");
    assert.equal(viaPnpm.flags["dry-run"], true);
  });
});

describe("canonicalJson / writeGeneratedJson", () => {
  it("ignores generatedAt when deciding if a file changed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "poe2-gen-"));
    const path = join(dir, "meta.json");
    const a = { source: "x", generatedAt: "2020-01-01T00:00:00.000Z", familyCount: 2 };
    const b = { source: "x", generatedAt: "2026-09-18T00:00:00.000Z", familyCount: 2 };
    assert.equal(canonicalJson(a), canonicalJson(b));
    await writeFile(path, JSON.stringify(a, null, 2) + "\n");
    const first = await writeGeneratedJson(path, b);
    assert.equal(first.written, false);
    assert.equal(first.reason, "unchanged");
    const c = { ...b, familyCount: 3 };
    const second = await writeGeneratedJson(path, c);
    assert.equal(second.written, true);
    const written = JSON.parse(await readFile(path, "utf8"));
    assert.equal(written.familyCount, 3);
    await rm(dir, { recursive: true, force: true });
  });

  it("dry-run does not write", async () => {
    const dir = await mkdtemp(join(tmpdir(), "poe2-gen-"));
    const path = join(dir, "missing.json");
    const result = await writeGeneratedJson(path, { ok: true }, { dryRun: true });
    assert.equal(result.written, false);
    assert.equal(result.reason, "dry-run");
    await rm(dir, { recursive: true, force: true });
  });
});

describe("validation", () => {
  it("rejects catastrophic family-count drops unless forced", () => {
    assert.throws(
      () => assertNoCatastrophicDrop(32, 10, "waystones.low"),
      ValidationError,
    );
    assert.doesNotThrow(() => assertNoCatastrophicDrop(32, 10, "waystones.low", { force: true }));
    assert.doesNotThrow(() => assertNoCatastrophicDrop(32, 30, "waystones.low"));
  });

  it("accepts the frozen generated catalog", async () => {
    const summary = await checkGeneratedDir(GENERATED);
    assert.ok(summary.shields >= 20);
    assert.ok(summary.waystones.low >= 20);
    assert.ok(summary.tablets.breach >= 10);
    assert.ok(summary.earlyGear.body.str >= 10);
    assert.ok(summary.earlyGear.mace1h.mace1h >= 10);
  });
});

describe("fetchText retries", () => {
  it("retries 503 then succeeds", async () => {
    let n = 0;
    const fetchImpl = async () => {
      n += 1;
      if (n === 1) return { ok: false, status: 503 };
      return { ok: true, text: async () => "hello" };
    };
    const body = await fetchText("https://example.test/page", {
      fetchImpl,
      retries: 3,
      retryDelayMs: 1,
      timeoutMs: 1000,
    });
    assert.equal(body, "hello");
    assert.equal(n, 2);
  });

  it("does not retry 404", async () => {
    let n = 0;
    const fetchImpl = async () => {
      n += 1;
      return { ok: false, status: 404 };
    };
    await assert.rejects(
      () => fetchText("https://example.test/missing", { fetchImpl, retries: 3, retryDelayMs: 1 }),
      (err) => err instanceof FetchError && err.status === 404,
    );
    assert.equal(n, 1);
  });
});
