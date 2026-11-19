function withSlash(path) {
  if (!path) return "/";
  return path.endsWith("/") ? path : path + "/";
}

function previewRedirectTarget(pathname, baseHref, search, hash) {
  var params = new URLSearchParams(search && search.charAt(0) === "?" ? search.slice(1) : search || "");
  if (params.has("spa")) return null;
  var match = String(pathname || "").match(/^(.*\/pr-preview\/pr-\d+)(\/.*)?$/);
  if (!match) return null;
  var previewRoot = withSlash(match[1]);
  if (withSlash(baseHref) === previewRoot) return null;
  var rest = match[2] && match[2] !== "/" ? match[2] : "/";
  return previewRoot + "?spa=" + encodeURIComponent(rest + (search || "") + (hash || ""));
}

globalThis.previewRedirectTarget = previewRedirectTarget;

if (typeof window !== "undefined" && window.location && typeof document !== "undefined") {
  var baseEl = document.querySelector("base");
  var baseHref = baseEl ? baseEl.getAttribute("href") || "/" : "/";
  var target = previewRedirectTarget(
    window.location.pathname,
    baseHref,
    window.location.search,
    window.location.hash,
  );
  if (target) window.location.replace(target);
}
