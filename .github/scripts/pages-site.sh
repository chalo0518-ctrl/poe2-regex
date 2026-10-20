#!/usr/bin/env bash
# Remember the live GitHub Pages tree on the pages-site branch.
# Production publishes the site root and keeps pr-preview/. Preview deploys
# replace only pr-preview/pr-<number>/ and then publish the whole tree again.
set -euo pipefail

remote="${PAGES_SITE_REMOTE:-origin}"
branch="${PAGES_SITE_BRANCH:-pages-site}"
root="$(git rev-parse --show-toplevel)"

usage() {
  echo "usage: pages-site.sh overlay <site-dir>" >&2
  echo "       pages-site.sh extract <site-dir>" >&2
  echo "       pages-site.sh publish <site-dir>" >&2
  exit 2
}

# 0 = branch exists, 1 = remote has no such branch, 2 = fetch failed
fetch_pages_branch() {
  local output status
  set +e
  output="$(git -C "$root" fetch "$remote" "+refs/heads/${branch}:refs/remotes/${remote}/${branch}" 2>&1)"
  status=$?
  set -e
  if [[ $status -eq 0 ]]; then
    return 0
  fi
  if [[ "$output" == *"couldn't find remote ref"* ]]; then
    return 1
  fi
  printf '%s\n' "$output" >&2
  return 2
}

cmd="${1:-}"
site_dir="${2:-}"
if [[ -z "$cmd" || -z "$site_dir" ]]; then
  usage
fi

case "$cmd" in
  overlay)
    if fetch_pages_branch; then
      if git -C "$root" cat-file -e "${remote}/${branch}:pr-preview" 2>/dev/null; then
        mkdir -p "$site_dir"
        git -C "$root" archive "${remote}/${branch}" pr-preview | tar -x -C "$site_dir"
      fi
    else
      status=$?
      if [[ $status -ne 1 ]]; then
        exit "$status"
      fi
    fi
    ;;
  extract)
    if fetch_pages_branch; then
      rm -rf "$site_dir"
      mkdir -p "$site_dir"
      git -C "$root" archive "${remote}/${branch}" | tar -x -C "$site_dir"
    else
      status=$?
      exit "$status"
    fi
    ;;
  publish)
    work="$(mktemp -d)"
    rmdir "$work"
    cleanup() {
      git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || true
      rm -rf "$work"
    }
    trap cleanup RETURN
    if fetch_pages_branch; then
      git -C "$root" worktree add --detach "$work" "${remote}/${branch}"
    else
      status=$?
      if [[ $status -ne 1 ]]; then
        exit "$status"
      fi
      git -C "$root" worktree add --detach "$work" HEAD
      git -C "$work" checkout --orphan "$branch"
      git -C "$work" reset
    fi
    find "$work" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
    mkdir -p "$site_dir"
    cp -a "$site_dir"/. "$work"/
    git -C "$work" add -A -f
    if git -C "$work" diff --cached --quiet; then
      echo "pages-site already matches this build"
      exit 0
    fi
    git -C "$work" \
      -c user.name="${GIT_AUTHOR_NAME:-github-actions[bot]}" \
      -c user.email="${GIT_AUTHOR_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}" \
      -c commit.gpgsign=false \
      commit -m "${PAGES_SITE_COMMIT_MESSAGE:-Update GitHub Pages site tree}"
    git -C "$work" push "$remote" "HEAD:refs/heads/${branch}"
    ;;
  *)
    usage
    ;;
esac
