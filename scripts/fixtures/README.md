# Pipeline fixtures

Trimmed **public** [poe2db.tw](https://poe2db.tw) `ModsView` HTML plus a tiny RePoE-fork `mods` sample.

- Rows are real affix effect text from live pages (Traditional Chinese `/tw`, English `/us`).
- Hover CDN URLs inside `str` are left as the site emits them; unused ModsView keys (`hover`, `adds_no`, …) are dropped to keep files small.
- Empty `str` waystone rows are kept so `skipEmpty` can be tested.
- `repoe/mods.sample.json` only has two real-shaped `type`/`text` objects for fallback tests — not a catalog.

Never copy `scripts/fixtures/out/` over `packages/data/generated/`. The fixture catalog is a handful of pages on purpose.

Captured 2026-09-18 from `https://poe2db.tw` + `https://repoe-fork.github.io/poe2/`. Early-gear pages (`Body_Armours_str` / `_dex`, `Rings`, `One_Hand_Maces`) captured 2026-09-21.
