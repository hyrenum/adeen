## Focused upgrade — Goals UI, Search, Hover, HideVerses button

### 1. Goal System UI refresh (`Active.tsx` + `Creation.tsx`)

Modernize to match the "Solo Leveling / holographic HUD" aesthetic already used across the app, while keeping all existing data, props, and handlers unchanged.

**Active.tsx**
- Replace the plain header with a HUD-style status bar: corner brackets, scan-line overlay, `[ STATUS ]` label, animated streak flame.
- Hero ring → layered concentric rings (outer faint track, inner segmented XP-style arc), monospace numeric in center, animated count-up on mount.
- Quick stats grid → "stat panel" cards with corner brackets, ALL-CAPS micro-label, large monospace value, faint scan-line bg.
- Add a 28-day heatmap row (uses existing `weekProgress` extended by a fetch of the last 28 days from `goal_progress`).
- Khatm day-progress block → segmented bar (10 ticks) + from→to "checkpoint" chips.
- Week dots → "missions" row with numbered tiles and a glow on today.
- Replace dashed CTA at bottom with a HUD button ("◢ NEW MISSION ◣").

**Creation.tsx**
- Replace the 2-column "ui card" layout with a single-column wizard panel framed in HUD brackets.
- Step indicator → segmented progress (e.g. `[█ █ ░ ░]`) with step label in monospace.
- Preset cards → bordered tiles with rarity-style accents (Recommended = gold-ish via primary, Custom = dashed), icon in bracketed slot.
- Frequency step → two large toggle tiles with active "selected" inset glow.
- Schedule preview → vertical "mission log" with timeline ticks and monospace day labels.
- Buttons: Back/Next/Start unified as `ui button` with bracket affixes; Start uses primary-filled HUD style.

No changes to `Use-Quran-Goals.ts`, `Goal.tsx`, or `Progress.tsx` props/signatures. `Progress_Ring` gets a `variant="segmented"` option for the new look (back-compat default unchanged).

### 2. Safhah Arabic hover → green

In `Layer/Top/Component/Quran/Layout/Safhah/Main.tsx` `buildWordClassName`, swap the hover class from `hover:text-primary` to a new `hover:text-[hsl(var(--quran-hover))]` (or `hover:text-emerald-400`) for the non-active, non-marker word branch. Add the `--quran-hover` token in `index.css` (light: `142 70% 35%`, dark: `142 65% 55%`). Apply only to the Safhah layout (not Ayah).

Also update `mem://style/color-constraints` and `mem://index.md` Core to record the exception: "Monochrome everywhere except Safhah Arabic hover, which uses green."

### 3. Search: rename Duas → Aid + broaden + improve

**Types** (`Search/Types.tsx`): `SearchCategory = "pages" | "quran" | "hadith" | "aid"`.

**Utility** (`Search/Utility.ts`):
- Replace the `duas` category with `aid` (label "Aid", placeholder "Search Duas, Arabic, Tajweed, Prayers…").
- Aid index combines: Dua categories (existing `duaCategories`), Arabic vocabulary (load `Aid/Arabic/Vocabulary.json` lazily, search by word/translation/root), Tajweed rules (walk the `Aid/Tajweed/**` JSON list — generate a static index file), Alphabet letters, and static Aid pages (Prayer Times, Qibla, Tasbih, Zakat, Hijri).
- Each result keeps `title/subtitle/arabicName/path/type` so `Results.tsx` renders unchanged.
- Add a relevance scorer in `AdvancedQuery.ts`: exact > startsWith > word-boundary > fuzzy; use `normalizeArabic` (already at `Layer/Top/Utility/Quran/Normalize-Arabic.ts`) so diacritics are ignored. Sort all results across categories by score before slicing to 8.
- Quran Verse search: extend `AVAILABLE_SURAHS_FOR_VERSE_SEARCH` from `[1,112,113,114]` to all 114 surahs via the existing `getSurah` API, but lazy-load on demand and cache (only when category=quran and query length ≥ 3).
- Page-number queries also accept "juz N" and "hizb N".

**Index** (`Search/Index.tsx`): update the duas nav entry label to "Aid" and route to `/Aid`; update default tab handling so the renamed category id propagates. Also keep "Aid" tab visible in the category bar.

**Search page** (`Page/Search.tsx`): mirror the rename and new aid scoring.

### 4. HideVerses button states (`Layer/Top/Component/Quran/Record.tsx`)

Replace the green/red `bg-primary` / `bg-red-500` styling on the eye Card with monochrome rules driven only by `hideVerses` and hover:

| State (light theme) | bg | icon |
|---|---|---|
| inactive (verses visible) | white | black, hover → bg black / icon white |
| active (verses hidden) | black | white, hover → bg white / icon black |

Dark theme inverts. Implement via:
```tsx
className={cn(
  "p-3 rounded-full cursor-pointer transition-all inline-flex items-center justify-center w-fit group",
  hideVerses
    ? "bg-black dark:bg-white hover:bg-white dark:hover:bg-black"
    : "bg-white dark:bg-black hover:bg-black dark:hover:bg-white"
)}
```
Icon className:
```tsx
hideVerses
  ? "text-white dark:text-black group-hover:text-black dark:group-hover:text-white"
  : "text-black dark:text-white group-hover:text-white dark:group-hover:text-black"
```
Use the same `<Eye>` icon for both states (no `EyeOff`) so only colors change, or keep `EyeOff` when active — confirm during build. Default: keep both icons.

### Files to be modified
- `Layer/Top/Component/Quran/Goal/Active.tsx`
- `Layer/Top/Component/Quran/Goal/Creation.tsx`
- `Layer/Top/Component/Quran/Goal/Progress.tsx` (add segmented variant only)
- `Layer/Top/Component/Quran/Layout/Safhah/Main.tsx`
- `Layer/Top/index.css` (add `--quran-hover` token)
- `Layer/Top/Component/Search/Types.tsx`
- `Layer/Top/Component/Search/Utility.ts`
- `Layer/Top/Component/Search/AdvancedQuery.ts`
- `Layer/Top/Component/Search/Index.tsx`
- `Layer/Top/Page/Search.tsx`
- `Layer/Top/Component/Quran/Record.tsx`
- `mem://style/color-constraints`, `mem://index.md` (record green-hover exception)

### Out of scope
- Recitation sync, auto-scroll, basmallah pre-fetch (deferred — would be a separate focused upgrade).
- Goal data model / hook changes.
