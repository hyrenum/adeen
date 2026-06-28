import alphabetData from "Server/Data/Aid/Alphabet/Letter.json";
import { nanoid } from 'nanoid';

// ============= Vite / Next.js (Turbopack) Glob Imports =============
const duaModules = import.meta.glob<{ default: any[][] }>(
  "Server/Data/Aid/Dua/*.json",
  { eager: true }
);

const tajweedModules = import.meta.glob<{ default: any }>(
  "Server/Data/Aid/Tajweed/**/*.json",
  { eager: true }
);

const feelingModules = import.meta.glob<{ default: string[] }>(
  "Server/Data/Aid/Feeling/*.json",
  { eager: true }
);

const pillarsModules = import.meta.glob<{ default: any[] }>(
  "Server/Data/Aid/Pillars/*.json",
  { eager: true }
);

const namesModules = import.meta.glob<{ default: string[][] }>(
  "Server/Data/Aid/Names/*.json",
  { eager: true }
);

const articlesModules = import.meta.glob<{ default: string[] }>(
  "Server/Data/Aid/Articles/*.json",
  { eager: true }
);

const prophetsModules = import.meta.glob<{ default: any[] }>(
  "Server/Data/Aid/Prophets/*.json",
  { eager: true }
);

// Glob import voor de losse Arabische Woorden JSON-bestanden
const arabicVocabularyModules = import.meta.glob<{ default: [string, string, string, string, string] }>(
  "Server/Data/Aid/Arabic/**/*.json",
  { eager: true }
);

// ============= Core TypeScript Type Definitions =============

export interface TajweedRule {
  letter: string;
  transliteration: string;
  description: string;
  example: string;
  exampleTranslation: string;
}

export interface TajweedSubcategory {
  id: string;
  name: string;
  description: string;
  rules: TajweedRule[];
}

export interface TajweedSubfolder {
  id: string;
  name: string;
  subcategories: TajweedSubcategory[];
}

export interface TajweedCategoryDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  hasSubfolders: boolean;
  subfolders: TajweedSubfolder[];
  subcategories: TajweedSubcategory[];
}

export interface TajweedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subcategories: TajweedSubcategory[];
}

export interface LetterForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface Letter {
  id: string;
  name: string;
  forms: LetterForms;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
}

export interface DuaItem {
  id: string;
  arabic: string;
  transliteration?: string | string[];
  translation: string;
  wbw?: string[];
  reference: string;
  extraReferences?: string[];
  audioUrl?: string;
}

export interface DuaCategory {
  name: string;
  duas: DuaItem[];
}

export interface FeelingEntry {
  verse: string;
  verseRef: string;
  hadith: string;
  hadithRef: string;
  note: string;
}

export interface FeelingCategory {
  id: string;
  name: string;
  data: FeelingEntry;
}

export interface PillarSection {
  heading: string;
  body: string;
}

export interface PillarDetail {
  id: string;
  name: string;
  english: string;
  source: string;
  sections: PillarSection[];
}

export interface DivineName {
  index: number;
  arabic: string;
  english: string;
  meaning: string;
}

export interface ArticleDetail {
  id: string;
  name: string;
  source: string;
}

export interface ProphetSection {
  heading: string;
  body: string;
}

export interface ProphetDetail {
  id: string;
  title: string;
  sections: ProphetSection[];
}

export interface ArabicWord {
  id: string;
  english: string;
  arabic: string;
  transliteration: string;
  root: string;
  arabicDefinition: string;
  definition: string;
}

export interface ArabicSubcategory {
  id: string;
  name: string;
  words: ArabicWord[];
}

export interface ArabicCategory {
  id: string;
  name: string;
  subcategories: ArabicSubcategory[];
}

export interface ArabicVocabularyEntry {
  id: string;
  name: string;
  subcategories: ArabicCategory[];
}

// ============= Formatting Utilities =============

function formatNameFromId(filename: string): string {
  return filename
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatIdFromFilename(filename: string): string {
  return filename.replace(/ /g, "-");
}

export function parseReference(ref: string): { text: string; number: string } | null {
  const index = ref.indexOf('#');
  if (index === -1) return null;
  return {
    text: ref.substring(0, index).trim(),
    number: ref.substring(index + 1).trim()
  };
}

// ============= Tajweed Hierarchical Pipeline Parsing =============

type FolderNode = {
  name: string;
  subfolders: Map<string, FolderNode>;
  files: TajweedSubcategory[];
  parentDescription?: string;
};

const categoryNodes: Map<string, FolderNode> = new Map();

for (const [path, mod] of Object.entries(tajweedModules)) {
  const data = mod.default;
  const pathParts = path.split("/");
  const tajweedIndex = pathParts.findIndex(part => part === "Tajweed");
  if (tajweedIndex === -1 || tajweedIndex + 1 >= pathParts.length) continue;

  const topFolder = pathParts[tajweedIndex + 1];
  let currentNode = categoryNodes.get(topFolder);
  if (!currentNode) {
    currentNode = { name: topFolder, subfolders: new Map(), files: [] };
    categoryNodes.set(topFolder, currentNode);
  }

  for (let i = tajweedIndex + 2; i < pathParts.length - 1; i++) {
    const folderName = pathParts[i];
    let next = currentNode!.subfolders.get(folderName);
    if (!next) {
      next = { name: folderName, subfolders: new Map(), files: [] };
      currentNode!.subfolders.set(folderName, next);
    }
    currentNode = next;
  }

  const filename = pathParts[pathParts.length - 1].replace(".json", "");
  const id = formatIdFromFilename(filename);
  const name = formatNameFromId(filename);

  if (filename.toLowerCase() === "parent") {
    if (Array.isArray(data) && data.length >= 1 && typeof data[0] === 'string') {
      currentNode!.parentDescription = data[0];
    }
    continue;
  }

  if (Array.isArray(data) && data.length >= 2 && typeof data[0] === 'string') {
    let description: string;
    let rulesArray: any[];

    if (typeof data[1] === 'string' && Array.isArray(data[2])) {
      description = data[1];
      rulesArray = data[2];
    } else if (Array.isArray(data[1])) {
      description = data[0];
      rulesArray = data[1];
    } else {
      continue;
    }

    const rules: TajweedRule[] = rulesArray.map((rule: any[]) => ({
      letter: rule[0],
      transliteration: rule[1],
      description: rule[2],
      example: rule[3],
      exampleTranslation: rule[4] || "",
    }));

    const subcategory: TajweedSubcategory = { id, name, description, rules };
    currentNode!.files.push(subcategory);
  }
}

const tajweedCategoryDetails: TajweedCategoryDetail[] = Array.from(categoryNodes.entries()).map(([folderName, node]) => {
  const hasSubfolders = node.subfolders.size > 0;
  const categoryBaseName = formatNameFromId(folderName);
  const categoryDisplayName = node.parentDescription ? `${categoryBaseName} - ${node.parentDescription}` : categoryBaseName;

  const subfolders: TajweedSubfolder[] = Array.from(node.subfolders.entries()).map(([subName, subNode]) => {
    const subBaseName = formatNameFromId(subName);
    const subDisplayName = subNode.parentDescription ? `${subBaseName} - ${subNode.parentDescription}` : subBaseName;
    return {
      id: formatIdFromFilename(subName),
      name: subDisplayName,
      subcategories: subNode.files,
    };
  });

  return {
    id: formatIdFromFilename(folderName),
    name: categoryDisplayName,
    description: hasSubfolders ? `${subfolders.length} sections` : `${node.files.length} ${node.files.length === 1 ? 'rule' : 'rules'}`,
    icon: "BookOpen",
    color: "#8B5CF6",
    hasSubfolders,
    subfolders,
    subcategories: node.files,
  };
});

const tajweedCategoriesFlat: TajweedCategory[] = tajweedCategoryDetails.map(cat => ({
  ...cat,
  subcategories: cat.hasSubfolders ? [] : cat.subcategories,
}));

// ============= Dua Data Processing =============

const duaCategories: DuaCategory[] = Object.entries(duaModules).map(([path, mod]) => {
  const filename = path.split("/").pop()?.replace(".json", "") || "";
  const duasArray = mod.default;

  if (!Array.isArray(duasArray) || (duasArray.length > 0 && !Array.isArray(duasArray[0]))) {
    return { name: formatNameFromId(filename), duas: [] };
  }

  return {
    name: formatNameFromId(filename),
    duas: duasArray.map((item: any[]) => {
      if (item.length >= 5 && typeof item[0] === 'string' && typeof item[2] === 'string' && typeof item[4] === 'string') {
        return {
          id: nanoid(),
          arabic: item[0],
          transliteration: item[1],
          translation: item[2],
          wbw: Array.isArray(item[3]) ? item[3] : undefined,
          reference: item[4],
        };
      } else {
        return {
          id: nanoid(),
          arabic: item[0] || "",
          translation: item[1] || "",
          reference: item[2] || "",
        };
      }
    }),
  };
});

// ============= Feelings Data Processing =============

const feelingCategories: FeelingCategory[] = Object.entries(feelingModules).map(([path, mod]) => {
  const filename = path.split("/").pop()?.replace(".json", "") || "";
  const arr = mod.default || [];
  return {
    id: filename,
    name: filename,
    data: {
      verse: arr[0] || "",
      verseRef: arr[1] || "",
      hadith: arr[2] || "",
      hadithRef: arr[3] || "",
      note: arr[4] || ""
    },
  };
});

// ============= Pillars Data Processing =============

const pillarsCategories: PillarDetail[] = Object.entries(pillarsModules).map(([path, mod]) => {
  const filename = path.split("/").pop()?.replace(".json", "") || "";
  const arr = mod.default || [];
  const parsedSections: PillarSection[] = (arr[3] || []).map((s: string[]) => ({
    heading: s[0] || "",
    body: s[1] || ""
  }));

  return {
    id: filename,
    name: arr[0] || filename,
    english: arr[1] || "",
    source: arr[2] || "",
    sections: parsedSections
  };
});

const pillarsOrder = ["Shahadah", "Salah", "Zakat", "Sawm", "Hajj"];
const sortedPillars = [...pillarsCategories].sort(
  (a, b) => pillarsOrder.indexOf(a.id) - pillarsOrder.indexOf(b.id)
);

// ============= Divine Names Data Processing =============

const divineNamesList: DivineName[] = Object.entries(namesModules).flatMap(([_, mod]) => {
  const dataArray = mod.default || [];
  return dataArray.map((item: any, idx: number) => ({
    index: idx + 1,
    arabic: item[0] || "",
    english: item[1] || "",
    meaning: item[2] || ""
  }));
});

// ============= Articles of Faith Data Processing =============

const articlesCategories: ArticleDetail[] = Object.entries(articlesModules).map(([path, mod]) => {
  const filename = path.split("/").pop()?.replace(".json", "") || "";
  const arr = mod.default || [];
  return {
    id: filename,
    name: arr[0] || filename,
    source: arr[1] || ""
  };
});

const articlesOrder = ["Allah", "Angels", "Books", "Messengers", "LastDay", "Qadar"];
const sortedArticles = [...articlesCategories].sort(
  (a, b) => articlesOrder.indexOf(a.id) - articlesOrder.indexOf(b.id)
);

export const ARTICLES_HADITH_SOURCE =
  'Narrated by ʿUmar ibn al-Khattab (RA): Jibrīl (ʿAS) came to the Prophet ﷺ and asked, ' +
  '"Tell me about īmān." He ﷺ said: "It is to believe in Allah, His Angels, His Books, ' +
  'His Messengers, the Last Day, and to believe in the Divine Decree — its good and its evil." ' +
  '(Sahih Muslim 8; the meaning is also in Sahih al-Bukhari 50)';

// ============= Prophets Data Processing =============

const prophetsCategories: ProphetDetail[] = Object.entries(prophetsModules).map(([path, mod]) => {
  const filename = path.split("/").pop()?.replace(".json", "") || "";
  const arr = mod.default || [];
  const parsedSections: ProphetSection[] = (arr[1] || []).map((s: string[]) => ({
    heading: s[0] || "",
    body: s[1] || ""
  }));

  return {
    id: filename,
    title: arr[0] || `${filename} (عليه السلام)`,
    sections: parsedSections
  };
});

const prophetsOrder = [
  "Adam", "Idris", "Nuh", "Hud", "Salih", "Ibrahim", "Lut", "Ismail", "Ishaq",
  "Yaqub", "Yusuf", "Ayyub", "Shu'ayb", "Musa", "Harun", "Dhul-Kifl", "Dawud",
  "Sulayman", "Ilyas", "Al-Yasa", "Yunus", "Zakariya", "Yahya", "Isa", "Muhammad"
];

const sortedProphets = [...prophetsCategories].sort(
  (a, b) => prophetsOrder.indexOf(a.id) - prophetsOrder.indexOf(b.id)
);

// ============= Dynamische Arabische Woordenschat Parser (Gecorrigeerd) =============

const arabicVocabularyList: ArabicVocabularyEntry[] = [];

for (const [filePath, module] of Object.entries(arabicVocabularyModules)) {
  const dataArray = module.default;
  if (!Array.isArray(dataArray) || dataArray.length < 5) continue;

  // Snijd alles vóór "Vocabulary" betrouwbaar weg om foute indexverschuivingen te voorkomen
  const allParts = filePath.split("/");
  const vocabIndex = allParts.findIndex(part => part === "Vocabulary");
  if (vocabIndex === -1 || vocabIndex + 3 >= allParts.length) continue;

  const mainCatName = allParts[vocabIndex];            // Exact: "Vocabulary"
  const catName = allParts[vocabIndex + 1];            // Exact: "Adjective" of "Noun"
  const subCatName = allParts[vocabIndex + 2];         // Exact: "Qualities" of "Fruits"
  const fileWordId = allParts[vocabIndex + 3].replace(".json", ""); // Exact: "Big" of "Apple"

  // 1. Zoek of maak Hoofdcategorie ("Vocabulary")
  let mainCat = arabicVocabularyList.find(v => v.id === mainCatName);
  if (!mainCat) {
    mainCat = { id: mainCatName, name: mainCatName, subcategories: [] };
    arabicVocabularyList.push(mainCat);
  }

  // 2. Zoek of maak Categorie ("Adjective")
  let category = mainCat.subcategories.find(c => c.id === catName);
  if (!category) {
    category = { id: catName, name: catName, subcategories: [] };
    mainCat.subcategories.push(category);
  }

  // 3. Zoek of maak Subcategorie ("Qualities")
  let subcategory = category.subcategories.find(s => s.id === subCatName);
  if (!subcategory) {
    subcategory = { id: subCatName, name: subCatName, words: [] };
    category.subcategories.push(subcategory);
  }

  // 4. Bouw het woord-object op ("Big")
  const wordItem: ArabicWord = {
    id: fileWordId,
    english: fileWordId,
    arabic: dataArray[0],
    transliteration: dataArray[1],
    root: dataArray[2],
    arabicDefinition: dataArray[3],
    definition: dataArray[4]
  };

  subcategory.words.push(wordItem);
}

// ============= Exported API Functional Endpoints =============

// --- Tajweed ---
export function getTajweedCategories(): TajweedCategory[] { return tajweedCategoriesFlat; }
export function getTajweedCategoryDetail(id: string): TajweedCategoryDetail | undefined { return tajweedCategoryDetails.find(c => c.id === id); }
export function getTajweedCategory(id: string): TajweedCategory | undefined {
  const detail = getTajweedCategoryDetail(id);
  if (!detail) return undefined;
  return { ...detail, subcategories: detail.hasSubfolders ? [] : detail.subcategories };
}
export function getTajweedSubcategory(categoryId: string, subcategoryId: string): TajweedSubcategory | undefined {
  const detail = getTajweedCategoryDetail(categoryId);
  if (!detail) return undefined;
  const flat = detail.subcategories.find(s => s.id === subcategoryId);
  if (flat) return flat;
  for (const folder of detail.subfolders) {
    const found = folder.subcategories.find(s => s.id === subcategoryId);
    if (found) return found;
  }
  return undefined;
}
export function getTajweedSubfolderSubcategory(categoryId: string, subfolderId: string, subcategoryId: string): TajweedSubcategory | undefined {
  return getTajweedCategoryDetail(categoryId)?.subfolders.find(f => f.id === subfolderId)?.subcategories.find(s => s.id === subcategoryId);
}

// --- Alphabet ---
const letters = alphabetData as Letter[];
export function getLetters(): Letter[] { return letters; }
export function getLetter(id: string): Letter | null { return letters.find((l) => l.id === id) ?? null; }

// --- Duas ---
export { duaCategories };
export function getDuaCategory(categoryName: string): DuaCategory | null { return duaCategories.find((c) => c.name === categoryName) ?? null; }
export function getAllDuaCategories(): DuaCategory[] { return duaCategories; }
export function searchDuas(query: string): (DuaItem & { categoryName: string; duaIndex: number })[] {
  const lower = query.toLowerCase();
  const results: (DuaItem & { categoryName: string; duaIndex: number })[] = [];
  for (const cat of duaCategories) {
    for (let i = 0; i < cat.duas.length; i++) {
      const item = cat.duas[i];
      if (item.translation.toLowerCase().includes(lower) || item.arabic.includes(query) || item.reference.toLowerCase().includes(lower)) {
        results.push({ ...item, categoryName: cat.name, duaIndex: i });
      }
    }
  }
  return results;
}

// --- Feelings ---
export function getFeelings(): FeelingCategory[] { return feelingCategories; }
export function getFeelingDetail(id: string): FeelingEntry | undefined { return feelingCategories.find((f) => f.id.toLowerCase() === id.toLowerCase())?.data; }

// --- Pillars ---
export function getPillars(): PillarDetail[] { return sortedPillars; }
export function getPillarDetail(id: string): PillarDetail | undefined { return pillarsCategories.find((p) => p.id.toLowerCase() === id.toLowerCase()); }

// --- Divine Names ---
export function getDivineNames(): DivineName[] { return divineNamesList; }

// --- Articles of Faith ---
export function getArticles(): ArticleDetail[] { return sortedArticles; }
export function getArticleDetail(id: string): ArticleDetail | undefined { return articlesCategories.find((a) => a.id.toLowerCase() === id.toLowerCase()); }

// --- Prophets ---
export function getProphets(): ProphetDetail[] { return sortedProphets; }
export function getProphetDetail(id: string): ProphetDetail | undefined { return prophetsCategories.find((p) => p.id.toLowerCase() === id.toLowerCase()); }

// --- Arabische Woordenschat API Endpoints (Case-Sensitive) ---
export function getVocabulary(): ArabicVocabularyEntry[] {
  return arabicVocabularyList;
}

export function getArabicCategories(vocabId = "Vocabulary"): ArabicCategory[] {
  return getVocabulary().find((v) => v.id === vocabId)?.subcategories ?? [];
}

export function getArabicCategory(catId: string, vocabId = "Vocabulary"): ArabicCategory | undefined {
  return getArabicCategories(vocabId).find((c) => c.id === catId);
}

export function getArabicSubcategory(catId: string, subId: string, vocabId = "Vocabulary"): ArabicSubcategory | undefined {
  return getArabicCategory(catId, vocabId)?.subcategories.find((s) => s.id === subId);
}

export function getArabicWord(catId: string, subId: string, wordId: string, vocabId = "Vocabulary"): ArabicWord | undefined {
  return getArabicSubcategory(catId, subId, vocabId)?.words.find((w) => w.id === wordId);
}