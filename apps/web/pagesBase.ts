export function resolvePagesBase(env: {
  PAGES_BASE?: string;
  GITHUB_PAGES?: string;
}): string {
  const fromEnv = env.PAGES_BASE?.trim();
  if (fromEnv) {
    const withSlash = fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
    if (!withSlash.startsWith("/") || withSlash.startsWith("//")) {
      throw new Error("PAGES_BASE must be an absolute path");
    }
    return withSlash;
  }
  if (env.GITHUB_PAGES === "true") return "/poe2-regex/";
  return "/";
}
