// Client/Component/Search/Utility.ts

import { Home, BookOpen, BookText, MessageSquare, Clock, Sparkles } from "lucide-react";
import { surahList, juzData } from "Server/API/Quran";
import { hadithCollections } from "Server/API/Hadith";
import { duaCategories, getTajweedCategories, getLetters } from "Server/API/Aid";
import vocabularyData from "Server/Data/Aid/Arabic/Vocabulary.json";
import { normalizeArabic } from "Client/Utility/Quran/Normalize-Arabic";
import { matchAnyField } from "./AdvancedQuery";
import type { SearchCategory, SearchResult, SearchCategoryConfig } from "./Types";

// ============= Pages =============
export const ALL_PAGES = [
  { name: "Home", path: "/", icon: Home },
  { name: "Quran", path: "/Quran", icon: BookOpen },
  { name: "Hadith", path: "/Hadith", icon: BookText },
  { name: "Aid", path: "/Aid", icon: Sparkles },
  { name: "Duas", path: "/Aid/Dua", icon: MessageSquare },
  { name: "Prayer Times", path: "/Aid/Prayer-Times", icon: Clock },
  { name: "Tajweed", path: "/Aid/Tajweed", icon: BookOpen },
  { name: "Arabic", path: "/Aid/Arabic", icon: BookOpen },
  { name: "Alphabet", path: "/Aid/Alphabet", icon: BookOpen },
  { name: "Qibla", path: "/Aid/Qibla", icon: Home },
  { name: "Tasbih Counter", path: "/Aid/Tasbih-Counter", icon: Home },
  { name: "Zakat Calculator", path: "/Aid/Zakat-Calculator", icon: Home },
  { name: "Hijri Calendar", path: "/Aid/Hijri-Calendar", icon: Home },
  { name: "Goals", path: "/Quran/Goals", icon: Home },
  { name: "Feedback", path: "/Feedback", icon: MessageSquare },
  { name: "Privacy", path: "/Privacy", icon: Home },
  { name: "Terms", path: "/Terms", icon: Home },
  { name: "Profile", path: "/Profile", icon: Home },
];

// ============= Categories =============
export const CATEGORIES: SearchCategoryConfig[] = [
  { id: "pages", label: "Pages", placeholder: "Search pages...", icon: Home },
  { id: "quran", label: "Quran", placeholder: "Search Surahs, Juz, Pages, Verses...", icon: BookOpen },
  { id: "hadith", label: "Hadith", placeholder: "Search Hadith collections...", icon: BookText },
  { id: "aid", label: "Aid", placeholder: "Search Duas, Arabic, Tajweed, Prayers...", icon: Sparkles },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const AVAILABLE_SURAHS_FOR_VERSE_SEARCH = [1, 112, 113, 114];

export interface VerseResult {
  surahId: number;
  surahName: string;
  verseNumber: number;
  arabic: string;
  translation: string;
  verseKey: string;
}

// ============= Helpers =============
export function getResultTypeLabel(category: SearchCategory): string {
  switch (category) {
    case "quran": return "Quran Results";
    case "hadith": return "Hadith Collections";
    case "aid": return "Aid Results";
    default: return "Pages";
  }
}

export function getCategoryLabel(category: SearchCategory): string {
  return CATEGORY_MAP[category]?.label || "Search";
}

// ============= Scoring =============
function scoreMatch(query: string, candidates: Array<string | undefined | null>): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let best = 0;
  for (const raw of candidates) {
    if (!raw) continue;
    const c = raw.toLowerCase();
    const cNorm = normalizeArabic(c);
    const qNorm = normalizeArabic(q);
    let s = 0;
    if (c === q || cNorm === qNorm) s = 100;
    else if (c.startsWith(q) || cNorm.startsWith(qNorm)) s = 80;
    else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(c)) s = 60;
    else if (c.includes(q) || cNorm.includes(qNorm)) s = 40;
    if (s > best) best = s;
  }
  return best;
}

// ============= Aid index =============
interface AidEntry {
  id: string;
  title: string;
  subtitle?: string;
  arabicName?: string;
  path: string;
  type: string;
  searchable: string[];
}

let _aidIndex: AidEntry[] | null = null;
function getAidIndex(): AidEntry[] {
  if (_aidIndex) return _aidIndex;
  const entries: AidEntry[] = [];

  // Duas
  for (const cat of duaCategories) {
    const slug = cat.name.replace(/ /g, "-");
    entries.push({
      id: `dua-${slug}`,
      title: cat.name,
      subtitle: `${cat.duas.length} duas`,
      path: `/Aid/Dua/${slug}`,
      type: "Dua",
      searchable: [cat.name, "dua"],
    });
  }

  // Arabic vocabulary (categories, subcategories, words)
  try {
    const vocab = vocabularyData as any;
    for (const cat of vocab.categories || []) {
      entries.push({
        id: `arabic-cat-${cat.id}`,
        title: cat.name,
        subtitle: "Arabic Category",
        arabicName: cat.arabicName,
        path: `/Aid/Arabic/${cat.title}`,
        type: "Arabic",
        searchable: [cat.name, cat.arabicName, cat.id],
      });
      for (const sub of cat.subcategories || []) {
        entries.push({
          id: `arabic-sub-${cat.id}-${sub.id}`,
          title: sub.name,
          subtitle: `${cat.name} · ${sub.words?.length || 0} words`,
          arabicName: sub.arabicName,
          path: `/Aid/Arabic/${cat.id}/${sub.id}`,
          type: "Arabic",
          searchable: [sub.name, sub.arabicName, sub.id],
        });
        for (const word of sub.words || []) {
          entries.push({
            id: `arabic-word-${word.id}`,
            title: word.english,
            subtitle: word.transliteration ? `${word.transliteration} · ${sub.name}` : sub.name,
            arabicName: word.arabic,
            path: `/Aid/Arabic/${cat.id}/${sub.id}/${word.id}`,
            type: "Word",
            searchable: [word.english, word.arabic, word.transliteration, word.root, word.definition],
          });
        }
      }
    }
  } catch (e) {
    console.error("Aid vocabulary index failed", e);
  }

  // Tajweed categories + rules
  try {
    for (const cat of getTajweedCategories()) {
      entries.push({
        id: `tajweed-${cat.id}`,
        title: cat.name,
        subtitle: "Tajweed Rule",
        path: `/Aid/Tajweed/${cat.id}`,
        type: "Tajweed",
        searchable: [cat.name, cat.description, "tajweed"],
      });
      for (const sub of cat.subcategories || []) {
        entries.push({
          id: `tajweed-${cat.id}-${sub.id}`,
          title: sub.name,
          subtitle: `${cat.name} · Tajweed`,
          path: `/Aid/Tajweed/${cat.id}/${sub.id}`,
          type: "Tajweed",
          searchable: [sub.name, sub.description],
        });
      }
    }
  } catch (e) {
    console.error("Aid tajweed index failed", e);
  }

  // Alphabet letters
  try {
    for (const l of getLetters()) {
      entries.push({
        id: `letter-${l.id}`,
        title: l.name,
        subtitle: l.pronunciation ? `Letter · ${l.pronunciation}` : "Letter",
        arabicName: l.forms?.isolated,
        path: `/Aid/Alphabet/${l.id}`,
        type: "Letter",
        searchable: [l.name, l.pronunciation, l.forms?.isolated],
      });
    }
  } catch (e) {
    console.error("Aid alphabet index failed", e);
  }

  // Aid static pages
  const aidPages = [
    { name: "Prayer Times", path: "/Aid/Prayer-Times" },
    { name: "Qibla", path: "/Aid/Qibla" },
    { name: "Tasbih Counter", path: "/Aid/Tasbih-Counter" },
    { name: "Zakat Calculator", path: "/Aid/Zakat-Calculator" },
    { name: "Hijri Calendar", path: "/Aid/Hijri-Calendar" },
  ];
  for (const p of aidPages) {
    entries.push({
      id: `aid-page-${p.path}`,
      title: p.name,
      subtitle: "Aid Page",
      path: p.path,
      type: "Page",
      searchable: [p.name],
    });
  }

  _aidIndex = entries;
  return entries;
}

// ============= Main search =============
export function searchByCategory(
  query: string,
  category: SearchCategory,
  navLinks: Array<{ name: string; path: string }>,
  supportLinks: Array<{ name: string; path: string }>
): SearchResult[] {
  if (!query.trim()) return [];
  const scored: Array<SearchResult & { _score: number }> = [];

  switch (category) {
    case "pages": {
      const allPages = [...ALL_PAGES, ...navLinks, ...supportLinks];
      for (const page of allPages) {
        const s = scoreMatch(query, [page.name, page.path]);
        if (s > 0) {
          scored.push({
            id: page.path,
            title: page.name,
            path: page.path,
            type: "Page",
            _score: s,
          });
        }
      }
      break;
    }

    case "quran": {
      for (const surah of surahList) {
        const s = scoreMatch(query, [
          surah.englishName,
          (surah as any).englishNameTransliteration,
          surah.name,
          surah.englishNameTranslation,
          String(surah.id),
        ]);
        if (s > 0) {
          scored.push({
            id: `surah-${surah.id}`,
            title: surah.englishName,
            subtitle: `${surah.numberOfAyahs} verses · ${surah.englishNameTranslation}`,
            arabicName: surah.name,
            path: `/Quran/Surah/${surah.id}`,
            type: "Surah",
            _score: s,
          });
        }
      }

      for (const juz of juzData) {
        const s = scoreMatch(query, [`juz ${juz.juzNumber}`, String(juz.juzNumber)]);
        if (s > 0) {
          scored.push({
            id: `juz-${juz.juzNumber}`,
            title: `Juz ${juz.juzNumber}`,
            subtitle: `Starts from Surah ${juz.surahs[0]?.id || 1}`,
            path: `/Quran/Juz/${juz.juzNumber}`,
            type: "Juz",
            _score: s,
          });
        }
      }

      const pageMatch = query.match(/^(?:page\s*)?(\d+)$/i);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1]);
        if (pageNum >= 1 && pageNum <= 604) {
          scored.push({
            id: `page-${pageNum}`,
            title: `Page ${pageNum}`,
            subtitle: "Quran Page",
            path: `/Quran/Page/${pageNum}`,
            type: "Page",
            _score: 90,
          });
        }
      }
      const hizbMatch = query.match(/^hizb\s*(\d+)$/i);
      if (hizbMatch) {
        const n = parseInt(hizbMatch[1]);
        if (n >= 1 && n <= 60) {
          scored.push({
            id: `hizb-${n}`,
            title: `Hizb ${n}`,
            subtitle: "Quran Hizb",
            path: `/Quran/Hizb/${n}`,
            type: "Hizb",
            _score: 90,
          });
        }
      }

      const verseMatch = query.match(/^(\d+):(\d+)$/);
      if (verseMatch) {
        const surahNum = parseInt(verseMatch[1]);
        const verseNum = parseInt(verseMatch[2]);
        const surah = surahList.find((s) => s.id === surahNum);
        if (surah && verseNum <= surah.numberOfAyahs) {
          scored.push({
            id: `verse-${surahNum}-${verseNum}`,
            title: `${surah.englishName} ${surahNum}:${verseNum}`,
            subtitle: `Verse ${verseNum} of ${surah.englishName}`,
            arabicName: surah.name,
            path: `/Quran/Surah/${surahNum}?verse=${verseNum}`,
            type: "Verse",
            _score: 95,
          });
        }
      }
      break;
    }

    case "hadith": {
      for (const collection of hadithCollections) {
        const s = scoreMatch(query, [collection.name, (collection as any).arabicName, (collection as any).slug]);
        if (s > 0) {
          scored.push({
            id: collection.id,
            title: collection.name,
            subtitle: `${collection.hadithCount.toLocaleString()} hadith`,
            arabicName: (collection as any).arabicName,
            path: `/Hadith/${collection.id}`,
            type: "Collection",
            _score: s,
          });
        }
      }
      break;
    }

    case "aid": {
      const idx = getAidIndex();
      for (const e of idx) {
        const s = scoreMatch(query, e.searchable);
        if (s > 0) {
          scored.push({
            id: e.id,
            title: e.title,
            subtitle: e.subtitle,
            arabicName: e.arabicName,
            path: e.path,
            type: e.type,
            _score: s,
          });
        }
      }
      break;
    }
  }

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, 8).map(({ _score, ...rest }) => rest);
}

// ============= Per-category helpers (kept for /Search page) =============
export function searchPages(query: string): SearchResult[] {
  return searchByCategory(query, "pages", [], []);
}

export function searchSurahs(query: string): SearchResult[] {
  return searchByCategory(query, "quran", [], []).filter(r => r.type === "Surah");
}

export function searchHadiths(query: string): SearchResult[] {
  return searchByCategory(query, "hadith", [], []);
}

export function searchDuas(query: string): SearchResult[] {
  return searchByCategory(query, "aid", [], []).filter(r => r.type === "Dua");
}

export function searchAid(query: string): SearchResult[] {
  return searchByCategory(query, "aid", [], []);
}

export async function searchVerses(query: string): Promise<VerseResult[]> {
  const lower = query.toLowerCase();
  const found: VerseResult[] = [];

  for (const surahId of AVAILABLE_SURAHS_FOR_VERSE_SEARCH) {
    try {
      const { getSurah } = await import("Server/API/Quran");
      const { surahList: sl } = await import("Server/API/Quran");
      const surah = await getSurah(surahId, { translation: "Direct" });
      const meta = sl.find((s) => s.id === surahId);
      if (!meta) continue;
      for (const verse of surah.verses) {
        if (verse.translation?.toLowerCase().includes(lower) || verse.arabic.includes(query)) {
          found.push({
            surahId: meta.id,
            surahName: meta.englishName,
            verseNumber: verse.verseNumber,
            arabic: verse.arabic,
            translation: verse.translation ?? "",
            verseKey: `${meta.id}:${verse.verseNumber}`,
          });
        }
      }
    } catch {}
  }

  return found.slice(0, 30);
}
