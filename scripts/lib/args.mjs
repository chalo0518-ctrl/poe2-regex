/**
 * Tiny argv parser for the data-update CLI.
 * Supports --flag, --flag=value, --flag value, and --no-flag.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function isMainModule(metaUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return fileURLToPath(metaUrl) === resolve(entry);
  } catch {
    return false;
  }
}

export function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--") {
      continue;
    }
    if (token.startsWith("--")) {
      const body = token.slice(2);
      if (body.startsWith("no-")) {
        flags[body.slice(3)] = false;
        continue;
      }
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
        continue;
      }
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        flags[body] = next;
        i++;
      } else {
        flags[body] = true;
      }
      continue;
    }
    positionals.push(token);
  }
  return { flags, positionals };
}

export function boolFlag(value, fallback = false) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  const v = String(value).toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return fallback;
}
