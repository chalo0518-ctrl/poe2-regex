# Data update pipeline

Frozen affix JSON lives in `packages/data/generated/`. The site never scrapes at runtime.

## Sources (public, no login)

| Source | What we take | What we do not take |
|---|---|---|
| [poe2db.tw](https://poe2db.tw) Chronicles pages (`/tw` + `/us`) | `new ModsView({...})` embedded in public HTML, plus harvest-tag chips | Nothing that needs a cookie, account, or private API |
| [RePoE-fork PoE2](https://repoe-fork.github.io/poe2/) | `mods.min.json` **match-text fallback only**, and the index title (`PoE2 version x.y.z`) as a label | We do not rebuild the UI catalog from RePoE. poe2db family grouping stays canonical; Traditional Chinese and English effect text come from `/tw` and `/us` |

poe2db pages used by the live refresh:

- Shields: `Shields_str`, `Shields_str_dex`, `Shields_str_int`, `Bucklers`
- Waystones: `Waystones_low_tier`, `Waystones_mid_tier`, `Waystones_top_tier` (independent pools)
- Tablets: `Breach_Tablet`, `Expedition_Tablet`, `Delirium_Tablet`, `Ritual_Tablet`, `Irradiated_Tablet`, `Overseer_Tablet`, `Abyss_Tablet`, `Temple_Tablet` (one pool per kind)

Shop/campaign defaults in `packages/data/src/campaign.ts` are **not** regenerated here. They reuse verified `match` / `matchZh` strings and stay hand-maintained until a real chapter map model exists.

## How to run

```bash
pnpm fetch-data                 # live scrape → packages/data/generated
pnpm fetch-data:shields         # shields + tags + meta only
pnpm fetch-data:endgame         # waystones + tablets only
pnpm fetch-data:check           # validate frozen JSON, no network
pnpm fetch-data -- --dry-run    # scrape/parse/validate, write nothing
pnpm fetch-data -- --force      # allow a large family-count drop (rare patches)
```

Parser tests (no live site required):

```bash
pnpm test:pipeline
pnpm fetch-data:fixtures        # writes scripts/fixtures/out (gitignored)
```

`--from-fixtures` **refuses** to overwrite `packages/data/generated` (partial fixture catalogs are not a full game dump). Pass `--out-dir` instead.

Equivalent Node entrypoints: `node scripts/update-data.mjs`, plus the older `node scripts/fetch-shields.mjs` / `node scripts/fetch-endgame.mjs`.

## Behaviour

- **Idempotent writes:** `generatedAt` is ignored when comparing. If affix text/ids/counts are unchanged, files are left alone (clean git diff).
- **All-or-nothing per invocation:** shields + endgame are fetched into memory first, then written. A failed tablet page does not leave half-updated JSON.
- **Failure modes:** empty pools, duplicate ids, missing `matchZh` / effect text, or a ≥30% family-count drop vs the previous snapshot abort the write (`exit 3`). The live path only fetches `/tw` + `/us`; a blocked `/cn` host cannot affect a successful 繁中+EN refresh. Network/timeouts after retries abort without writing (`exit 2`).
- **Retries:** HTTP GET uses timeout + retry on 429/5xx/network. 404 is not retried.
- **Concurrency:** default 3 pages at a time.

## CI / GitHub Actions

| Workflow | When | What |
|---|---|---|
| `.github/workflows/ci.yml` | pull requests + `main` | `pnpm test` (includes pipeline fixture tests) + `pnpm --filter web build` |
| `.github/workflows/update-data.yml` | weekly Monday 06:00 UTC + `workflow_dispatch` | fixture path always; live scrape best-effort; opens a PR if frozen JSON actually changed |
| `.github/workflows/pages.yml` | push to `main` | deploy the already-frozen data (does not scrape) |

### Egress / secrets

Live scrape needs outbound HTTPS to:

- `poe2db.tw` (and `cdn.poe2db.tw` if HTML references it; we only parse the page body)
- `repoe-fork.github.io`

No repository secrets are required. GitHub-hosted runners are sometimes blocked or rate-limited by poe2db.tw. That is expected: the scheduled job treats **network failure (exit 2)** as a soft skip, while parser tests still gate PRs. If Actions stay blocked, run `pnpm fetch-data` locally (or on a machine that can reach Taiwan/CDN egress) and open a PR with the generated diff.

Optional env (local or Actions):

| Variable | Default | Purpose |
|---|---|---|
| `POE2DB_ORIGIN` | `https://poe2db.tw` | Mirror / proxy origin |
| `POE2DB_TIMEOUT_MS` | `20000` | Per-request timeout |
| `POE2DB_RETRIES` | `3` | Attempts |
| `POE2DB_RETRY_DELAY_MS` | `800` | Backoff base |
| `POE2DB_UA` | project UA | Override User-Agent if a host requires it |
| `REPOE_ORIGIN` / `REPOE_MODS_URL` / `REPOE_INDEX_URL` | RePoE-fork GH Pages | Fallback JSON + version label |

## Fixtures

`scripts/fixtures/` holds **trimmed** public ModsView HTML. Rows are real affix text copied from live poe2db pages; hover URLs are left inside `str` as the live page has them. They are not a full itemization dump and must not be treated as a new game patch.

See `scripts/fixtures/README.md`.

## Remaining risks

- poe2db HTML shape (`new ModsView(`) can change without notice; parse tests will fail first.
- RePoE English `text` uses `[Tag|Tag]` markup; we only use it when poe2db `/us` had no `str`.
- Campaign shop mods and chapter map nodes are out of this pipeline (`match` / `matchZh` on shop mods are copied from live `/us` and `/tw` pages by hand).
- GitHub Actions may not be able to scrape poe2db.tw; local refresh remains the reliable live path.
- This repo does not scrape `/cn` or store Simplified Chinese affix text. Never invent Simplified strings here.
