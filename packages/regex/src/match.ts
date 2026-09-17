/**
 * Interpret a generated PoE search string against item clipboard text.
 * Quoted groups are AND; a leading `!` negates that group.
 * Intended for unit tests, not the in-game engine.
 */
export function matchesItem(pattern: string, itemText: string): boolean {
  if (!pattern) return true;
  const groups: string[] = [];
  const re = /"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pattern))) {
    groups.push(m[1]);
  }
  if (groups.length === 0) groups.push(pattern);

  return groups.every((raw) => {
    let body = raw;
    let negate = false;
    if (body.startsWith("!")) {
      negate = true;
      body = body.slice(1);
    }
    const rx = new RegExp(body, "i");
    const hit = rx.test(itemText);
    return negate ? !hit : hit;
  });
}
