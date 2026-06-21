// Hadith API — refactored to use new split layout:
//   Source/{Top}/{Author}/{Chapter}/{N}.json          → arabic (string)
//   Translation/{Lang}/{Top}/{Author}/{Chapter}/{N}.json → translation (string)
//   Transliteration/{Lang}/{Top}/{Author}/{Chapter}/{N}.json → transliteration (string, mostly empty)
//   Kalima-Bi-Kalima/{Lang}/{Top}/{Author}/{Chapter}/{N}.json → word-by-word (array, mostly empty)
//
// We eagerly load Source + English Translation only; transliteration / wbw
// are loaded lazily when populated so the bundle stays small.

export interface Hadith {
  id: string;          // file stem (e.g. "1", "2302.2")
  numericId: number;   // best-effort numeric for sorting/display
  arabic: string;
  transliteration: string | string[];
  translation: string;
  wbw?: string[];
  narrator: string;
}

export interface HadithChapter {
  id: string;
  name: string;
  arabicName?: string;
  hadithRange: string;
  hadithCount: number;
  hadith: Hadith[];
}

export interface HadithChapterMeta {
  id: string;
  name: string;
  arabicName?: string;
  hadithRange: string;
  hadithCount: number;
}

export interface HadithCollection {
  id: string;          // == slug
  slug: string;
  name: string;
  author: string;
  topFolder: string;   // Sahih / Sunan / Jami / ...
  authorFolder: string;
  hadithCount: number;
  description: string;
}

// ---------- helpers ----------
function formatName(id: string): string {
  return id
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function unwrap(mod: unknown): string {
  const v = (mod as { default: unknown }).default;
  return typeof v === "string" ? v : "";
}

function unwrapArr(mod: unknown): string[] | undefined {
  const v = (mod as { default: unknown }).default;
  return Array.isArray(v) ? (v as string[]) : undefined;
}

// ---------- eager globs ----------
const sourceFiles = import.meta.glob("@/Bottom/Data/Hadith/Source/**/*.json", { eager: true });
const translationFiles = import.meta.glob("@/Bottom/Data/Hadith/Translation/English/**/*.json", { eager: true });

// Parse a path like ".../Hadith/Source/Sahih/al-Bukhari/Revelation/1.json"
// Returns { top, author, chapter, stem }
function parseSourcePath(path: string) {
  const m = path.match(/\/Hadith\/Source\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\.json$/);
  if (!m) return null;
  return { top: m[1], author: m[2], chapter: m[3], stem: m[4] };
}

function parseTranslationPath(path: string) {
  const m = path.match(/\/Hadith\/Translation\/English\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\.json$/);
  if (!m) return null;
  return { top: m[1], author: m[2], chapter: m[3], stem: m[4] };
}

// translation lookup map
const translationMap = new Map<string, string>();
for (const [path, mod] of Object.entries(translationFiles)) {
  const p = parseTranslationPath(path);
  if (!p) continue;
  translationMap.set(`${p.top}/${p.author}/${p.chapter}/${p.stem}`, unwrap(mod));
}

// ---------- build collections + chapters ----------
type ChapterAcc = { id: string; name: string; hadith: Hadith[] };
type CollAcc = {
  top: string;
  author: string;
  chapters: Map<string, ChapterAcc>;
};

const collMap = new Map<string, CollAcc>(); // key = `${top}/${author}`

for (const [path, mod] of Object.entries(sourceFiles)) {
  const p = parseSourcePath(path);
  if (!p) continue;
  const key = `${p.top}/${p.author}`;
  let coll = collMap.get(key);
  if (!coll) {
    coll = { top: p.top, author: p.author, chapters: new Map() };
    collMap.set(key, coll);
  }
  let ch = coll.chapters.get(p.chapter);
  if (!ch) {
    ch = { id: p.chapter, name: formatName(p.chapter), hadith: [] };
    coll.chapters.set(p.chapter, ch);
  }
  const tKey = `${p.top}/${p.author}/${p.chapter}/${p.stem}`;
  const numericId = Number.parseFloat(p.stem);
  ch.hadith.push({
    id: p.stem,
    numericId: Number.isFinite(numericId) ? numericId : 0,
    arabic: unwrap(mod),
    transliteration: "",
    translation: translationMap.get(tKey) ?? "",
    narrator: "",
  });
}

// sort hadith within chapters
for (const coll of collMap.values()) {
  for (const ch of coll.chapters.values()) {
    ch.hadith.sort((a, b) => a.numericId - b.numericId || a.id.localeCompare(b.id));
  }
}

// ---------- public collections array ----------
function collDisplayName(top: string, author: string): string {
  return `${formatName(top)} ${author.replace(/-/g, " ")}`.trim();
}

function collSlug(top: string, author: string): string {
  return `${top}-${author}`;
}

export const hadithCollections: HadithCollection[] = Array.from(collMap.values())
  .map(c => {
    const total = Array.from(c.chapters.values()).reduce((s, ch) => s + ch.hadith.length, 0);
    return {
      id: collSlug(c.top, c.author),
      slug: collSlug(c.top, c.author),
      name: collDisplayName(c.top, c.author),
      author: c.author.replace(/-/g, " "),
      topFolder: c.top,
      authorFolder: c.author,
      hadithCount: total,
      description: `${formatName(c.top)} collection compiled by ${c.author.replace(/-/g, " ")}.`,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const collBySlug = new Map(hadithCollections.map(c => [c.slug, c]));

export function getCollection(identifier: string): HadithCollection | null {
  return collBySlug.get(identifier) ?? hadithCollections.find(c => c.id === identifier) ?? null;
}

function rangeOf(hadith: Hadith[]): string {
  if (!hadith.length) return "";
  const first = hadith[0].id;
  const last = hadith[hadith.length - 1].id;
  return first === last ? first : `${first}-${last}`;
}

function chaptersOf(slug: string): ChapterAcc[] {
  const c = getCollection(slug);
  if (!c) return [];
  const acc = collMap.get(`${c.topFolder}/${c.authorFolder}`);
  if (!acc) return [];
  return Array.from(acc.chapters.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getChaptersByCollection(identifier: string): HadithChapterMeta[] {
  return chaptersOf(identifier).map(ch => ({
    id: ch.id,
    name: ch.name,
    hadithRange: rangeOf(ch.hadith),
    hadithCount: ch.hadith.length,
  }));
}

export function getChapter(collectionIdentifier: string, chapterId: string): HadithChapter | null {
  const ch = chaptersOf(collectionIdentifier).find(c => c.id === chapterId);
  if (!ch) return null;
  return {
    id: ch.id,
    name: ch.name,
    hadithRange: rangeOf(ch.hadith),
    hadithCount: ch.hadith.length,
    hadith: ch.hadith,
  };
}

export function getHadithsByChapter(collectionIdentifier: string, chapterId: string): Hadith[] {
  return getChapter(collectionIdentifier, chapterId)?.hadith ?? [];
}

export function getFullTransliteration(hadith: Hadith): string {
  if (Array.isArray(hadith.transliteration)) return hadith.transliteration.join(" ");
  return hadith.transliteration ?? "";
}
