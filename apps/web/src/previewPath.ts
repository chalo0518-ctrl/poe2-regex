export function previewHistoryUrl(baseUrl: string, search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const spa = params.get("spa");
  if (!spa || !spa.startsWith("/") || spa.startsWith("//")) return null;
  const base = baseUrl.replace(/\/$/, "");
  const hashIndex = spa.indexOf("#");
  const beforeHash = hashIndex === -1 ? spa : spa.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : spa.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const pathname = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex);
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return null;
  return `${base}${pathname}${query}${hash}`;
}

export function restorePreviewRoute(): void {
  const next = previewHistoryUrl(import.meta.env.BASE_URL, window.location.search);
  if (next) window.history.replaceState(null, "", next);
}
