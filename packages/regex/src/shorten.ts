function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function minLength(target: string): number {
  return hasCjk(target) ? 2 : 3;
}

/**
 * Shortest substring of `target` that does not appear in any `others`.
 * CJK needs at least 2 characters, Latin at least 3 — 1-char hits false-positive in stash.
 * At a given length, prefer a suffix (usually the noun: 生命, Fire).
 */
export function shortestUnique(target: string, others: string[]): string {
  if (!target) return target;
  const haystacks = others.map((s) => s.toLowerCase());
  const startLen = Math.min(minLength(target), target.length);

  for (let len = startLen; len <= target.length; len++) {
    const unique: string[] = [];
    for (let i = 0; i <= target.length - len; i++) {
      const slice = target.slice(i, i + len);
      if (slice.trim() !== slice) continue;
      if (/^[\s\\^$.*+?()[\]{}|]+$/.test(slice)) continue;
      const needle = slice.toLowerCase();
      if (!haystacks.some((h) => h.includes(needle))) {
        unique.push(slice);
      }
    }
    if (unique.length === 0) continue;
    return unique.find((s) => target.endsWith(s)) ?? unique[0];
  }

  return target;
}
