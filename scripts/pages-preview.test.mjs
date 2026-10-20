import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const exec = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, ".github/scripts/pages-site.sh");

function loadRedirect() {
  const code = readFileSync(join(repoRoot, "apps/web/public/preview-redirect.js"), "utf8");
  const sandbox = { URLSearchParams, encodeURIComponent };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.previewRedirectTarget;
}

describe("preview redirect", () => {
  it("sends a production 404 on a preview deep link to that preview", () => {
    const target = loadRedirect();
    assert.equal(
      target(
        "/poe2-regex/pr-preview/pr-13/endgame/crafting",
        "/poe2-regex/",
        "",
        "",
      ),
      "/poe2-regex/pr-preview/pr-13/?spa=" + encodeURIComponent("/endgame/crafting"),
    );
  });

  it("does nothing when the document is already the preview", () => {
    const target = loadRedirect();
    assert.equal(
      target(
        "/poe2-regex/pr-preview/pr-13/endgame/crafting",
        "/poe2-regex/pr-preview/pr-13/",
        "",
        "",
      ),
      null,
    );
  });

  it("does not loop once spa is set", () => {
    const target = loadRedirect();
    assert.equal(
      target("/poe2-regex/pr-preview/pr-13/endgame/crafting", "/poe2-regex/", "?spa=%2Fendgame%2Fcrafting", ""),
      null,
    );
  });

  it("is referenced by the web entry", async () => {
    const html = await readFile(join(repoRoot, "apps/web/index.html"), "utf8");
    assert.match(html, /src="%BASE_URL%preview-redirect\.js"/);
  });
});

describe("pages-site branch", () => {
  it("publishes a tree and overlays only pr-preview onto a newer production build", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "pages-site-"));
    const bare = join(tmp, "bare.git");
    const source = join(tmp, "source");
    try {
      await exec("git", ["init", "--bare", bare]);
      await exec("git", ["init", source]);
      await exec("git", ["-C", source, "config", "user.email", "test@example.com"]);
      await exec("git", ["-C", source, "config", "user.name", "Test"]);
      await writeFile(join(source, "README.md"), "seed\n");
      await exec("git", ["-C", source, "add", "README.md"]);
      await exec("git", ["-C", source, "commit", "-m", "seed"]);
      await exec("git", ["-C", source, "remote", "add", "origin", bare]);
      await exec("git", ["-C", source, "push", "origin", "HEAD:refs/heads/main"]);

      const first = join(tmp, "first");
      await mkdir(join(first, "pr-preview/pr-7"), { recursive: true });
      await writeFile(join(first, "index.html"), '<base href="/poe2-regex/">\n');
      await writeFile(join(first, "pr-preview/pr-7/index.html"), "old-preview\n");
      await exec("bash", [script, "publish", first], { cwd: source });

      const next = join(tmp, "next");
      await mkdir(next, { recursive: true });
      await writeFile(join(next, "index.html"), '<base href="/poe2-regex/">\nv2\n');
      await exec("bash", [script, "overlay", next], { cwd: source });
      assert.match(await readFile(join(next, "index.html"), "utf8"), /v2/);
      assert.equal(await readFile(join(next, "pr-preview/pr-7/index.html"), "utf8"), "old-preview\n");

      const extracted = join(tmp, "extracted");
      await exec("bash", [script, "extract", extracted], { cwd: source });
      assert.match(await readFile(join(extracted, "index.html"), "utf8"), /\/poe2-regex\//);
      assert.equal(await readFile(join(extracted, "pr-preview/pr-7/index.html"), "utf8"), "old-preview\n");

      await exec("bash", [script, "publish", next], { cwd: source });
      const extractedAgain = join(tmp, "extracted-again");
      await exec("bash", [script, "extract", extractedAgain], { cwd: source });
      assert.match(await readFile(join(extractedAgain, "index.html"), "utf8"), /v2/);
      assert.equal(await readFile(join(extractedAgain, "pr-preview/pr-7/index.html"), "utf8"), "old-preview\n");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
